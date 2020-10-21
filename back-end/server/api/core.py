#!/usr/bin/env python3

"""Implements the core APIs, which handle authentication and basic functionality that all citizens can access."""

from flask import Blueprint, abort, jsonify, request
from ..persistence.authentication import DeviceIndex, RegisteredDevice
from ..persistence.votes import VoteIndex

def authenticate(req, device_index, require_admin=False) -> RegisteredDevice:
    device_id = req.args.get('deviceId')
    if device_id is None:
        json_data = req.json
        device_id = json_data.get('deviceId')

    device = device_index.devices.get(device_id)
    if require_admin and device is not None and device.user_id not in device_index.admins:
        return None
    else:
        return device

def get_auth_level(req, device_index):
    device = authenticate(req, device_index)
    if not device:
        return 'unauthenticated'
    elif device.user_id in device_index.developers:
        return 'authenticated-developer'
    elif device.user_id in device_index.admins:
        return 'authenticated-admin'
    else:
        return 'authenticated'

def get_json_arg(req, key: str):
    try:
        return req.json[key]
    except KeyError:
        abort(400)

def create_core_blueprint(device_index: DeviceIndex, vote_index: VoteIndex):
    """Creates a blueprint for the core API."""
    bp = Blueprint('core', __name__)

    @bp.route('/active-votes', methods=['POST'])
    def get_active_votes():
        """Gets all currently active votes."""
        device = authenticate(request, device_index)
        if not device:
            abort(403)

        return jsonify(vote_index.get_active_votes(device))

    @bp.route('/all-votes', methods=['POST'])
    def get_all_votes():
        """Gets all votes."""
        return jsonify([vote['vote'] for vote in vote_index.votes.values()])

    @bp.route('/vote', methods=['POST'])
    def get_vote():
        """Gets a specific vote."""
        device = authenticate(request, device_index)
        if not device:
            abort(403)

        vote_data = vote_index.get_vote(get_json_arg(request, 'voteId'), device)
        if vote_data is None:
            abort(404)
        else:
            return jsonify(vote_data)

    @bp.route('/cast-ballot', methods=['POST'])
    def cast_ballot():
        """Receives a cast ballot."""
        device = authenticate(request, device_index)
        if not device:
            abort(403)

        ballot = get_json_arg(request, 'ballot')
        voteId = get_json_arg(request, 'voteId')
        return jsonify(vote_index.cast_ballot(voteId, ballot, device))

    @bp.route('/is-authenticated', methods=['POST'])
    def check_is_authenticated():
        return jsonify(get_auth_level(request, device_index))

    @bp.route('/user-id', methods=['POST'])
    def get_user_id():
        device = authenticate(request, device_index)
        return jsonify(device.user_id)

    return bp
