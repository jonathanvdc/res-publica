#!/usr/bin/env python3

"""Implements the admin APIs, which handle votes and other election related things."""

from flask import Blueprint, abort, jsonify, request

from .core import get_json_arg, authenticate
from ..persistence.authentication import DeviceIndex
from ..persistence.votes import VoteIndex
from ..persistence.helpers import send_to_log


def create_election_management_blueprint(device_index: DeviceIndex, vote_index: VoteIndex):
    """Creates a blueprint for the election management API."""
    bp = Blueprint('election-management', __name__)

    @bp.route('/suspicious-ballots', methods=['POST'])
    def suspicious_ballots():
        """Gets a report of all suspicious ballots cast in an election."""
        device = authenticate(request, device_index, True)
        if not device:
            abort(403)

        vote_id = get_json_arg(request, 'voteId')
        return jsonify(vote_index.get_suspicious_ballots_report(vote_id))

    @bp.route('/create-vote', methods=['POST'])
    def create_vote():
        """Creates a new vote."""
        device = authenticate(request, device_index, True)
        if not device:
            abort(403)

        proposal = get_json_arg(request, 'proposal')
        result = vote_index.create_vote(proposal)
        send_to_log(
            f'{device.user_id} has created a new vote with the id {result["id"]}.',
            name='election-management',
            level="INFO"
        )
        return jsonify(result)

    @bp.route('/cancel-vote', methods=['POST'])
    def cancel_vote():
        """Cancels a vote."""
        device = authenticate(request, device_index, True)
        if not device:
            abort(403)

        vote_id = get_json_arg(request, 'voteId')
        result = vote_index.cancel_vote(vote_id)
        if result:
            send_to_log(
                f'{device.user_id} has cancelled a vote with the id {vote_id}.',
                name='election-management',
                level="INFO"
            )
        return jsonify(result)

    @bp.route('/edit-vote', methods=['POST'])
    def edit_vote():
        """Edits a vote. The type of ballot must not change."""
        device = authenticate(request, device_index, True)
        if not device:
            abort(403)

        vote = get_json_arg(request, 'vote')
        result = vote_index.edit_vote(vote, device)
        send_to_log(
            f'{device.user_id} has edited the vote with the id {vote["id"]}.',
            name='election-management',
            level="INFO"
        )
        return jsonify(result)

    @bp.route('/add-vote-option', methods=['POST'])
    def add_vote_option():
        """Adds a candidate to the ballot for an election."""
        device = authenticate(request, device_index, True)
        if not device:
            abort(403)

        vote_id = get_json_arg(request, 'voteId')
        candidate = get_json_arg(request, 'option')
        result = vote_index.add_option(vote_id, candidate, device)
        send_to_log(
            f'{device.user_id} has retroactively added {candidate["name"]} to the vote with the id {vote_id}.',
            name='election-management',
            level="INFO"
        )
        return jsonify(result)

    @bp.route('/resign', methods=['POST'])
    def process_resignation():
        """Marks a candidate as having resigned from their seat."""
        device = authenticate(request, device_index, True)
        if not device:
            abort(403)

        vote_id = get_json_arg(request, 'voteId')
        option_id = get_json_arg(request, 'optionId')
        result = vote_index.mark_resignation(vote_id, option_id, device)
        send_to_log(
            f'{device.user_id} has marked resignation for {option_id} in the vote with the id {vote_id}.',
            name='election-management',
            level="INFO"
        )
        return jsonify(result)

    return bp
