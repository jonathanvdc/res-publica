#!/usr/bin/env python3

import random
import time
import os
from Crypto.Hash import SHA3_256
from pathlib import Path
from typing import Any, Dict, List
from .helpers import read_json, write_json, send_to_log
from .authentication import RegisteredDevice


VoteId = str
OptionId = str
BallotId = str
Vote = Any
VoteAndBallots = Any
Ballot = Any


def is_vote_active(vote: VoteAndBallots) -> bool:
    return vote['vote']['deadline'] > time.time()


class VoteIndex(object):
    """Keeps track of votes."""
    def __init__(self, index_path: str, votes: Dict[VoteId, VoteAndBallots], vote_secrets: Dict[VoteId, str]):
        self.index_path = index_path
        self.votes = votes
        self.vote_secrets = vote_secrets
        self.last_heartbeat = time.monotonic()

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
            send_to_log(f'Attempted to get nonexistent vote {vote_id}')
            raise

    def cast_ballot(self, vote_id: VoteId, ballot: Ballot, device: RegisteredDevice) -> Ballot:
        """Casts a ballot."""
        self.heartbeat()

        vote = self.votes[vote_id]
        if not is_vote_active(vote):
            return { 'error': 'Vote already closed. Sorry!' }

        ballot_id = self.get_ballot_id(vote_id, device)
        vote['ballots'] = [ballot for ballot in vote['ballots'] if ballot['id'] != ballot_id]
        ballot['id'] = ballot_id
        ballot['timestamp'] = time.time()
        vote['ballots'].append(ballot)
        self.write_vote(vote)
        return ballot

    def add_option(self, vote_id: VoteId, option, device: RegisteredDevice) -> Vote:
        """Adds a vote option to a vote that may already be active."""
        self.heartbeat()

        voteAndBallots = self.votes[vote_id]
        vote = voteAndBallots['vote']
        if not is_vote_active(voteAndBallots):
            return { 'error': 'Vote already closed. Sorry!' }
        elif any(opt['id'] == option['id'] for opt in vote['options']):
            return { 'error': f'A vote option with ID {option["id"]} already exists.' }

        vote['options'].append(option)

        if 'min' in vote['type']:
            # Fix all ballots by autofilling them with a rating of zero
            # for the new candidate.
            for ballot in voteAndBallots['ballots']:
                ballot['ratingPerOption'].append({
                    'optionId': option['id'],
                    'rating': vote['type']['min']
                })

        # Transmit the new vote.
        return self.prepare_for_transmission(voteAndBallots, device)['vote']

    def mark_resignation(self, vote_id: VoteId, optionId: OptionId, device: RegisteredDevice) -> Vote:
        """Indicates that a candidate has resigned from their seat."""
        self.heartbeat()

        vote = self.votes[vote_id]
        if is_vote_active(vote):
            return { 'error': 'Vote not closed yet.' }

        resignations = vote['vote'].get('resigned', [])
        if optionId in resignations:
            return { 'error': 'Candidate has already resigned.' }

        # Make the candidate resign.
        resignations.append(optionId)
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

    def get_ballot_id(self, vote_id: VoteId, device: RegisteredDevice) -> BallotId:
        """Gets a user's ballot ID for a particular vote."""
        self.heartbeat()
        if not self.vote_secrets.get(vote_id):
            raise ValueError(f'Vote with ID {vote_id} either does not exist or is no longer active.')

        hash_obj = SHA3_256.new(device.user_id.encode('utf-8'))
        hash_obj.update(self.vote_secrets[vote_id].encode('utf-8'))
        return hash_obj.hexdigest()

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

        self.votes[new_id] = { 'vote': new_vote, 'ballots': [] }

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


def read_or_create_vote_index(path: str) -> VoteIndex:
    """Reads a vote index from a file; creates a blank vote index if
       the file does not exist."""
    try:
        vote_secrets = read_json(path)
    except FileNotFoundError:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        return VoteIndex(path, {}, {})

    votes = {
        vote_id: read_json(vote_id_to_path(path, vote_id))
        for vote_id in vote_secrets.keys()
    }

    return VoteIndex(path, votes, vote_secrets)
