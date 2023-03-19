#!/usr/bin/env python3

"""Implements the core APIs, which handle authentication and basic functionality that all citizens can access."""

from flask import Blueprint, abort, jsonify, request
from ..persistence.authentication import DeviceIndex, RegisteredDevice, Permission, UserId
from ..persistence.votes import VoteIndex
from typing import Dict, List

_default_permissions: Dict[str, Permission] = {}

"""Authenticates a request. If the request is not authenticated, returns None. Otherwise, returns the device that made the request."""
def authenticate(req, device_index: DeviceIndex, permission: Permission=None) -> RegisteredDevice:
    device_id = req.args.get('deviceId')
    if device_id is None:
        json_data = req.json
        if not json_data:
            return None
        device_id = json_data.get('deviceId')

    device = device_index.devices.get(device_id)

    if permission is not None \
        and permission not in get_user_permissions(device.user_id, device_index):
        return None
    else:
        return device
    
def get_user_permissions(user_id: UserId, device_index: DeviceIndex) -> List[Permission]:
    found_perms = []

    for perm in device_index.permissions:
        if perm(user_id, device_index):
            found_perms.append(perm)

    if user_id in device_index.developers:
        found_perms.extend(_default_permissions['authenticated-developer'])

    if user_id in device_index.admins:
        found_perms.extend(_default_permissions['authenticated-admin'])

    found_perms.extend(_default_permissions['authenticated'])

    found_perms = list(set(found_perms))
    return found_perms

"""Gets the authentication level of a request, based on the role system."""
def get_auth_level(req, device_index: DeviceIndex) -> str:
    device = authenticate(req, device_index)
    if not device:
        return 'unauthenticated'
    elif device.user_id in device_index.developers:
        return 'authenticated-developer'
    elif device.user_id in device_index.admins:
        return 'authenticated-admin'
    else:
        return 'authenticated'


def get_json_arg(req, key: str, nullable=False):
    try:
        return req.json[key]
    except KeyError:
        if nullable:
            return None
        else:
            abort(400)


def create_core_blueprint(device_index: DeviceIndex, vote_index: VoteIndex, default_permissions: Dict[str, Dict[str, Dict[str, List[UserId]]]]):
    """Creates a blueprint for the core API."""
    bp = Blueprint('core', __name__)

    for user_group in default_permissions.keys():
        for scope in default_permissions[user_group].keys():
            if not user_group in _default_permissions:
                _default_permissions[user_group] = [Permission(scope, permission) for permission in default_permissions[user_group][scope]]
            else:
                _default_permissions[user_group].extend([Permission(scope, permission) for permission in default_permissions[user_group][scope]])

    @bp.route('/active-votes', methods=['POST'])
    def get_active_votes():
        """Gets all currently active votes."""
        device = authenticate(request, device_index, permission=Permission.VOTE_VIEW)
        if not device:
            abort(403)

        return jsonify(vote_index.get_active_votes(device))

    @bp.route('/all-votes', methods=['POST'])
    def get_all_votes():
        """Gets all votes."""
        device = authenticate(request, device_index, permission=Permission.VOTE_VIEW)
        if not device:
            abort(403)

        return jsonify([vote['vote'] for vote in vote_index.votes.values()])

    @bp.route('/vote', methods=['POST'])
    def get_vote():
        """Gets a specific vote."""
        device = authenticate(request, device_index, permission=Permission.VOTE_VIEW)
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
        device = authenticate(request, device_index, permission=Permission.VOTE_CAST)
        if not device:
            abort(403)

        ballot = get_json_arg(request, 'ballot')
        vote_id = get_json_arg(request, 'voteId')
        return jsonify(vote_index.cast_ballot(vote_id, ballot, device))

    @bp.route('/is-authenticated', methods=['POST'])
    def check_is_authenticated():
        return jsonify(get_auth_level(request, device_index))

    @bp.route('/user-id', methods=['POST'])
    def get_user_id():
        device = authenticate(request, device_index)
        if not device:
            abort(403)

        return jsonify(device.user_id)

    @bp.route('/unregister-user', methods=['POST'])
    def unregister_user():
        device = authenticate(request, device_index)
        if not device:
            abort(403)

        device_index.unregister_user(device.user_id)
        return jsonify({})
    
    @bp.route('/get-permissions', methods=['POST'])
    def get_permissions():
        device = authenticate(request, device_index)
        if not device:
            abort(403)

        return jsonify([str(perm) for perm in get_user_permissions(device.user_id, device_index)])
    
    @bp.route('/check-permission', methods=['POST'])
    def check_permission(scope, permission):
        device = authenticate(request, device_index)
        if not device:
            abort(403)

        scope = get_json_arg(request, 'scope')
        permission = get_json_arg(request, 'permission', nullable=True)

        if permission is None:
            return jsonify([str(perm) for perm in get_user_permissions(device.user_id, device_index) if perm.scope == scope])
        else:
            return jsonify(Permission(scope, permission)(device.user_id, device_index))

    return bp
