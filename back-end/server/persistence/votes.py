#!/usr/bin/env python3

import random
import time
import os
from Crypto.Hash import SHA3_256
from pathlib import Path
from typing import Any, DefaultDict, Dict, List, Union, Optional
from .helpers import read_json, write_json, send_to_log
from .authentication import DeviceIndex, RegisteredDevice, UserId

VoteId = str
OptionId = str
BallotId = str
Vote = Any
VoteAndBallots = Any
Ballot = Any
SuspiciousBallot = Any


def is_vote_active(vote: VoteAndBallots) -> bool:
    return vote['vote']['deadline'] > time.time()


def get_ballot_kind(ballot_type: Any) -> str:
    tally = ballot_type['tally']
    if tally == 'first-past-the-post' or tally == 'sainte-lague':
        return 'choose-one'
    elif tally == 'spsv' or tally == 'star':
        return 'rate-options'
    elif tally == 'stv':
        return 'rank-options'
    else:
        raise Exception(f'Unknown tallying algorithm {tally}.')


def get_suspicious_ballots_path(index_path: str) -> str:
    return Path(index_path).parent.joinpath('suspicious-ballots.json')


class VoteIndex(object):
    """Keeps track of votes."""

    def __init__(self,
                 index_path: str,
                 devices: DeviceIndex,
                 votes: Dict[VoteId, VoteAndBallots],
                 vote_secrets: Dict[VoteId, str],
                 suspicious_ballots: Dict[VoteId, List[SuspiciousBallot]]):

        self.index_path = index_path
        self.devices = devices
        self.votes = votes
        self.vote_secrets = vote_secrets
        self.suspicious_ballots = suspicious_ballots
        self.last_heartbeat = time.monotonic()

        # The ballot ID cache remembers ballot IDs.
        self.ballot_id_cache = DefaultDict(dict)
        self.ballot_to_voter_cache = DefaultDict(dict)

    def heartbeat(self):
        """Allows the vote index to perform cleanup. In practice, this means that vote secrets
           for closed votes are deleted."""
        if time.monotonic() - self.last_heartbeat < 10:
            # Do nothing if the last heartbeat was less than ten seconds ago.
            return

        # Otherwise, scan for closed votes and delete their vote secrets.
        closed_votes = {
            name
            for name, vote in self.votes.items()
            if not is_vote_active(vote) and self.vote_secrets[name]
        }
        if closed_votes:
            # Clear caches.
            for vote_id in closed_votes:
                self.ballot_id_cache[vote_id].clear()
                self.ballot_to_voter_cache[vote_id].clear()

            # Delete vote secrets.
            self.vote_secrets = {
                k: '' if k in closed_votes else v
                for k, v in self.vote_secrets.items()
            }
            self.write_index()

        self.last_heartbeat = time.monotonic()

    def get_active_votes(self, device: RegisteredDevice) -> List[VoteAndBallots]:
        """Gets all currently active votes."""
        self.heartbeat()
        return [
            self.prepare_for_transmission(vote, device)
            for vote in self.votes.values()
            if is_vote_active(vote)
        ]

    def get_vote(self, vote_id: VoteId, device: RegisteredDevice) -> Vote:
        """Gets a vote."""
        self.heartbeat()
        try:
            return self.prepare_for_transmission(self.votes[vote_id], device)
        except KeyError:
            send_to_log(f'Attempted to get nonexistent vote {vote_id}', name='votes')
            raise

    def get_suspicious_ballots_report(self, vote_id: VoteId) -> List[SuspiciousBallot]:
        """Gets the suspicious ballot report for `vote_id`."""
        self.heartbeat()
        return self.suspicious_ballots.get(vote_id, [])

    def cast_ballot(self, vote_id: VoteId, ballot: Ballot, device: RegisteredDevice) -> Ballot:
        """Casts a ballot."""
        self.heartbeat()

        vote = self.votes[vote_id]
        if not is_vote_active(vote):
            return {'error': 'Vote already closed. Sorry!'}

        ballot_id = self.get_ballot_id(vote_id, device)
        vote['ballots'] = [ballot for ballot in vote['ballots'] if ballot['id'] != ballot_id]
        ballot['id'] = ballot_id
        ballot['timestamp'] = time.time()

        self.check_if_suspicious(vote_id, ballot, device)

        vote['ballots'].append(ballot)
        self.write_vote(vote)

        return ballot

    def check_if_suspicious(self, vote_id: VoteId, ballot: Ballot, device: RegisteredDevice):
        """Checks if `ballot` looks suspicious. Suspicion is cast when another voter seems to have
           cast a ballot already from the same device."""
        vote = self.votes[vote_id]

        persistent_id = device.persistent_id()
        visitor_id = device.visitor_id()

        # Iterate through all other ballots and check if they seem to be originating from the same
        # source.
        for other_ballot in vote['ballots']:
            if other_ballot['id'] == ballot['id']:
                continue

            voter_id = self.find_voter(vote_id, other_ballot)
            if voter_id == None:
                continue

            for other_device in self.devices.users_to_devices.get(voter_id, []):
                if other_device.persistent_id() == persistent_id or other_device.visitor_id() == visitor_id:
                    self.log_suspicious_ballot(vote_id, ballot, other_ballot, device, other_device)
                    return

    def log_suspicious_ballot(
        self,
        vote_id: VoteId,
        first_ballot: Ballot,
        second_ballot: Ballot,
        first_device: RegisteredDevice,
        second_device: RegisteredDevice):
        """Logs the arrival of a suspicious ballot."""

        report = {
            'firstBallot': first_ballot,
            'secondBallot': second_ballot,
            'firstDevice': first_device.to_json(),
            'secondDevice': second_device.to_json()
        }

        self.suspicious_ballots.setdefault(vote_id, []).append(report)
        self.write_suspicious_ballots()

    def find_voter(self, vote_id: VoteId, ballot: Ballot) -> Optional[str]:
        """Finds the user that cast `ballot`."""
        ballot_id = ballot['id']
        memoized_result = self.ballot_to_voter_cache[vote_id].get(ballot_id)
        if memoized_result:
            return memoized_result

        for user_id in self.devices.users_to_devices.keys():
            if ballot_id == self.get_ballot_id(vote_id, user_id):
                self.ballot_to_voter_cache[vote_id][ballot_id] = user_id
                return user_id

        return None

    def add_option(self, vote_id: VoteId, option, device: RegisteredDevice) -> Vote:
        """Adds a vote option to a vote that may already be active."""
        self.heartbeat()

        vote_and_ballots = self.votes[vote_id]
        vote = vote_and_ballots['vote']
        if not is_vote_active(vote_and_ballots):
            return {'error': 'Vote already closed. Sorry!'}
        elif any(opt['id'] == option['id'] for opt in vote['options']):
            return {'error': f'A vote option with ID {option["id"]} already exists.'}

        vote['options'].append(option)

        if 'min' in vote['type']:
            # Fix all ballots by autofilling them with a rating of zero
            # for the new candidate.
            for ballot in vote_and_ballots['ballots']:
                ballot['ratingPerOption'].append({
                    'optionId': option['id'],
                    'rating': vote['type']['min']
                })

        # Write the updated vote to disk.
        self.write_vote(vote_and_ballots)

        # Transmit the new vote.
        return self.prepare_for_transmission(vote_and_ballots, device)['vote']

    def edit_vote(self, vote: Vote, device: RegisteredDevice) -> Vote:
        """Edits a vote. The ballot type must not change."""
        self.heartbeat()

        vote_and_ballots = self.votes[vote['id']]
        old_vote = vote_and_ballots['vote']

        old_option_ids = [opt['id'] for opt in old_vote['options']]
        new_option_ids = [opt['id'] for opt in vote['options']]

        if old_option_ids != new_option_ids and old_vote['deadline'] < time.time():
            return {'error': 'Candidates cannot be added or removed after the election has ended.'}
        elif get_ballot_kind(old_vote['type']) != get_ballot_kind(vote['type']):
            return {
                'error': f'Cannot change ballots of type {get_ballot_kind(old_vote["type"])} '
                         f'to type {get_ballot_kind(vote["type"])}.'
            }

        # Update the vote.
        vote_and_ballots['vote'] = vote

        # Add/remove candidates from ballots.
        added_candidates = set(new_option_ids).difference(old_option_ids)
        removed_candidates = set(old_option_ids).difference(new_option_ids)

        new_ballots = []
        for ballot in vote_and_ballots['ballots']:
            if 'ratingPerOption' in ballot:
                # Remove deleted candidates.
                ratings = [r for r in ballot['ratingPerOption'] if r['optionId'] not in removed_candidates]

                # Add new candidates by giving them the minimal score.
                for candidate_id in added_candidates:
                    ratings.append({
                        'optionId': candidate_id,
                        'rating': vote['type']['min']
                    })

                # Update ballot.
                ballot['ratingPerOption'] = ratings
                new_ballots.append(ballot)
            elif 'selectedOptionId' in ballot and ballot['selectedOptionId'] in removed_candidates:
                # Drop ballots that voted only for a removed candidate.
                pass
            else:
                new_ballots.append(ballot)

        # Write the updated vote to disk.
        self.write_vote(vote_and_ballots)

        # Transmit the new vote.
        return self.prepare_for_transmission(vote_and_ballots, device)['vote']

    def mark_resignation(self, vote_id: VoteId, option_id: OptionId, device: RegisteredDevice) -> Vote:
        """Indicates that a candidate has resigned from their seat."""
        self.heartbeat()

        vote = self.votes[vote_id]
        if is_vote_active(vote):
            return {'error': 'Vote not closed yet.'}

        resignations = vote['vote'].get('resigned', [])
        if option_id in resignations:
            return {'error': 'Candidate has already resigned.'}

        # Make the candidate resign.
        resignations.append(option_id)
        vote['vote']['resigned'] = resignations
        self.write_vote(vote)

        # Return the vote.
        return self.prepare_for_transmission(vote, device)['vote']

    def prepare_for_transmission(self, vote: VoteAndBallots, device: RegisteredDevice) -> VoteAndBallots:
        """Prepares a vote for transmission."""
        self.heartbeat()
        if is_vote_active(vote):
            result = {
                'vote': vote['vote'],
                'ballots': []
            }
            ballot_id = self.get_ballot_id(vote['vote']['id'], device)
            for ballot in vote['ballots']:
                if ballot['id'] == ballot_id:
                    result['ownBallot'] = ballot
                    break

            return result
        else:
            return vote

    def get_ballot_id(self, vote_id: VoteId, user: Union[RegisteredDevice, UserId]) -> BallotId:
        """Gets a user's ballot ID for a particular vote."""
        self.heartbeat()
        if not self.vote_secrets.get(vote_id):
            raise ValueError(f'Vote with ID {vote_id} either does not exist or is no longer active.')

        if isinstance(user, RegisteredDevice):
            user = user.user_id

        result = self.ballot_id_cache[vote_id].get(user)
        if not result:
            hash_obj = SHA3_256.new(user.encode('utf-8'))
            hash_obj.update(self.vote_secrets[vote_id].encode('utf-8'))
            result = hash_obj.hexdigest()
            self.ballot_id_cache[vote_id][user] = result

        return result

    def create_vote(self, proposal: Vote) -> Vote:
        """Creates a new vote based on a proposal."""
        self.heartbeat()
        new_vote = proposal.copy()

        # Create an ID for the vote.
        new_id_parts = []
        for c in proposal['name'].lower():
            if c.isalnum():
                new_id_parts.append(c)
            elif len(new_id_parts) > 0 and new_id_parts[-1] != '-':
                new_id_parts.append('-')

        new_base_id = ''.join(new_id_parts)

        if new_base_id in self.votes:
            # If a vote with that name already exists, then we'll add a suffix.
            dup_count = 1
            while True:
                dup_count += 1
                new_id = f'{new_base_id}-{dup_count}'
                if new_id not in self.votes:
                    break
        else:
            new_id = new_base_id

        new_vote['id'] = new_id

        self.votes[new_id] = {'vote': new_vote, 'ballots': []}

        # Generate a secret.
        secret_hash = SHA3_256.new(new_id.encode('utf-8'))
        for _ in range(1, 20):
            secret_hash.update(str(random.randint(0, 100000000)).encode('utf-8'))

        self.vote_secrets[new_id] = secret_hash.hexdigest()
        self.write_vote(self.votes[new_id])
        self.write_index()

        return new_vote

    def cancel_vote(self, vote_id: VoteId) -> bool:
        """Cancels a vote."""
        self.heartbeat()
        if vote_id in self.votes:
            vote = self.votes[vote_id]
            if is_vote_active(vote):
                del self.votes[vote_id]
                del self.vote_secrets[vote_id]
                self.write_index()
                return True

        return False

    def write_index(self):
        """Writes the index itself to disk."""
        write_json(self.vote_secrets, self.index_path)

    def write_suspicious_ballots(self):
        """Writes suspicious ballot reports to disk."""
        write_json(self.suspicious_ballots, get_suspicious_ballots_path(self.index_path))

    def write_vote(self, vote: VoteAndBallots):
        """Writes a vote to disk."""
        vote_id = vote['vote']['id']
        vote_path = vote_id_to_path(self.index_path, vote_id)
        Path(vote_path).parent.mkdir(parents=True, exist_ok=True)
        write_json(vote, vote_path)


def vote_id_to_path(index_path: str, vote_id: VoteId) -> str:
    """Takes a vote ID and an index path and turns it into a path to the location
       where the vote's data is stored."""
    return os.path.join(os.path.dirname(index_path), 'votes', vote_id) + '.json'


def read_or_create_vote_index(path: str, devices: DeviceIndex) -> VoteIndex:
    """Reads a vote index from a file; creates a blank vote index if
       the file does not exist."""
    try:
        vote_secrets = read_json(path)
    except FileNotFoundError:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        return VoteIndex(path, devices, {}, {}, {})

    votes = {
        vote_id: read_json(vote_id_to_path(path, vote_id))
        for vote_id in vote_secrets.keys()
    }

    try:
        suspicious_ballots = read_json(get_suspicious_ballots_path(path))
    except FileNotFoundError:
        suspicious_ballots = {}

    return VoteIndex(path, devices, votes, vote_secrets, suspicious_ballots)
