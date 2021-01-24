#!/usr/bin/env python3

"""Implements the core APIs, which handle authentication and basic functionality that all citizens can access."""

from flask import Blueprint, abort, jsonify, request
from ..persistence.authentication import DeviceIndex, RegisteredDevice
from ..persistence.votes import VoteIndex
from .core import get_json_arg, authenticate

def create_election_management_blueprint(device_index: DeviceIndex, vote_index: VoteIndex):
    """Creates a blueprint for the election management API."""
    bp = Blueprint('election-management', __name__)

    @bp.route('/create-vote', methods=['POST'])
    def create_vote():
        """Creates a new vote."""
        device = authenticate(request, device_index, True)
        if not device:
            abort(403)

        proposal = get_json_arg(request, 'proposal')
        return jsonify(vote_index.create_vote(proposal))

    @bp.route('/cancel-vote', methods=['POST'])
    def cancel_vote():
        """Cancels a vote."""
        device = authenticate(request, device_index, True)
        if not device:
            abort(403)

        vote_id = get_json_arg(request, 'voteId')
        return jsonify(vote_index.cancel_vote(vote_id))

    @bp.route('/edit-vote', methods=['POST'])
    def edit_vote():
        """Edits a vote. The type of ballot must not change."""
        device = authenticate(request, device_index, True)
        if not device:
            abort(403)

        vote = get_json_arg(request, 'vote')
        return jsonify(vote_index.edit_vote(vote, device))

    @bp.route('/add-vote-option', methods=['POST'])
    def add_vote_option():
        """Adds a candidate to the ballot for an election."""
        device = authenticate(request, device_index, True)
        if not device:
            abort(403)

        vote_id = get_json_arg(request, 'voteId')
        candidate = get_json_arg(request, 'option')
        return jsonify(vote_index.add_option(vote_id, candidate, device))

    @bp.route('/resign', methods=['POST'])
    def process_resignation():
        """Marks a candidate as having resigned from their seat."""
        device = authenticate(request, device_index, True)
        if not device:
            abort(403)

        vote_id = get_json_arg(request, 'voteId')
        option_id = get_json_arg(request, 'optionId')
        return jsonify(vote_index.mark_resignation(vote_id, option_id, device))

    return bp
