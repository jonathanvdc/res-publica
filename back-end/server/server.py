#!/usr/bin/env python3

import os
import json
import praw
import prawcore.exceptions
import subprocess
from pathlib import Path
from typing import List
from collections import defaultdict
from flask import Flask, request, redirect, send_from_directory, jsonify, abort
from werkzeug.exceptions import NotFound
from werkzeug.urls import url_encode
from .persistence.authentication import read_or_create_device_index, RegisteredDevice
from .persistence.votes import read_or_create_vote_index
from .persistence.helpers import write_json, send_to_log
from .scrape import scrape_cfc

def create_app(config, bottle_path, data_path='data'):
    """Creates the server as a Flask app."""

    app = Flask(__name__, static_folder='../front-end/build')

    Path(data_path).mkdir(parents=True, exist_ok=True)
    device_index = read_or_create_device_index(
        os.path.join(data_path, 'device-index.json'),
        config.get('voter-requirements', []))
    vote_index = read_or_create_vote_index(os.path.join(data_path, 'vote-index.json'))

    def authenticate(req, require_admin=False) -> RegisteredDevice:
        device_id = req.args.get('deviceId')
        if device_id is None:
            json_data = req.json
            device_id = json_data.get('deviceId')

        device = device_index.devices.get(device_id)
        if require_admin and device is not None and device.user_id not in device_index.admins:
            return None
        else:
            return device

    def get_json_arg(req, key: str):
        try:
            return req.json[key]
        except KeyError:
            abort(400)

    def get_auth_level(req):
        device = authenticate(req)
        if not device:
            return 'unauthenticated'
        elif device.user_id in device_index.developers:
            return 'authenticated-developer'
        elif device.user_id in device_index.admins:
            return 'authenticated-admin'
        else:
            return 'authenticated'

    def get_available_optional_apis(req) -> List[str]:
        return config.get('optional-apis', {}).get(get_auth_level(req), [])

    def can_access_optional_api(req, api_name) -> bool:
        return api_name in get_available_optional_apis(req)

    @app.route('/api/active-votes', methods=['POST'])
    def get_active_votes():
        """Gets all currently active votes."""
        device = authenticate(request)
        if not device:
            abort(403)

        return jsonify(vote_index.get_active_votes(device))

    @app.route('/api/all-votes', methods=['POST'])
    def get_all_votes():
        """Gets all votes."""
        return jsonify([vote['vote'] for vote in vote_index.votes.values()])

    @app.route('/api/vote', methods=['POST'])
    def get_vote():
        """Gets a specific vote."""
        device = authenticate(request)
        if not device:
            abort(403)

        vote_data = vote_index.get_vote(get_json_arg(request, 'voteId'), device)
        if vote_data is None:
            abort(404)
        else:
            return jsonify(vote_data)

    @app.route('/api/cast-ballot', methods=['POST'])
    def cast_ballot():
        """Receives a cast ballot."""
        device = authenticate(request)
        if not device:
            abort(403)

        ballot = get_json_arg(request, 'ballot')
        voteId = get_json_arg(request, 'voteId')
        return jsonify(vote_index.cast_ballot(voteId, ballot, device))

    @app.route('/api/admin/create-vote', methods=['POST'])
    def create_vote():
        """Creates a new vote."""
        device = authenticate(request, True)
        if not device:
            abort(403)

        proposal = get_json_arg(request, 'proposal')
        return jsonify(vote_index.create_vote(proposal))

    @app.route('/api/admin/cancel-vote', methods=['POST'])
    def cancel_vote():
        """Cancels a vote."""
        device = authenticate(request, True)
        if not device:
            abort(403)

        vote_id = get_json_arg(request, 'voteId')
        return jsonify(vote_index.cancel_vote(vote_id))

    @app.route('/api/admin/resign', methods=['POST'])
    def process_resignation():
        """Marks a candidate as having resigned from their seat."""
        device = authenticate(request, True)
        if not device:
            abort(403)

        vote_id = get_json_arg(request, 'voteId')
        option_id = get_json_arg(request, 'optionId')
        return jsonify(vote_index.mark_resignation(vote_id, option_id, device))

    @app.route('/api/admin/scrape-cfc', methods=['POST'])
    def process_scrape_cfc():
        """Scrapes a Reddit CFC."""
        device = authenticate(request, True)
        if not device:
            abort(403)

        return jsonify(
            scrape_cfc(
                praw.Reddit(**config['bot-credentials']),
                get_json_arg(request, 'url'),
                get_json_arg(request, 'discernCandidates')))

    @app.route('/api/client-id')
    def get_client_id():
        return jsonify(config['webapp-credentials']['client_id'])

    @app.route('/api/is-authenticated', methods=['POST'])
    def check_is_authenticated():
        return jsonify(get_auth_level(request))

    @app.route('/api/user-id', methods=['POST'])
    def get_user_id():
        device = authenticate(request)
        return jsonify(device.user_id)

    @app.route('/api/optional/available', methods=['POST'])
    def process_available_optional_apis():
        return jsonify(get_available_optional_apis(request))

    @app.route('/api/optional/registered-voters', methods=['POST'])
    def process_get_registered_voters():
        if not can_access_optional_api(request, 'registered-voters'):
            abort(403)

        return jsonify(list(sorted(device_index.registered_voters)))

    @app.route('/api/optional/add-registered-voter', methods=['POST'])
    def process_add_registered_voter():
        if not can_access_optional_api(request, 'add-registered-voter'):
            abort(403)

        device_index.register_user(get_json_arg(request, 'userId'))
        return jsonify({})

    @app.route('/api/optional/remove-registered-voter', methods=['POST'])
    def process_remove_registered_voter():
        if not can_access_optional_api(request, 'remove-registered-voter'):
            abort(403)

        device_index.unregister_user(get_json_arg(request, 'userId'))
        return jsonify({})

    @app.route('/api/optional/upgrade-server', methods=['POST'])
    def process_upgrade_server():
        if not can_access_optional_api(request, 'upgrade-server'):
            abort(403)

        # Ask the manager to upgrade and restart us after we shut down.
        write_json({ 'action': 'restart' }, bottle_path)

        func = request.environ.get('werkzeug.server.shutdown')
        if func is None:
            raise RuntimeError('Not running with the Werkzeug Server')

        func()
        return jsonify({})

    @app.route('/reddit-auth')
    def process_auth():
        # Make sure that there's been no error.
        error = request.args.get('error')
        if error:
            return redirect(f'auth-failed?error={error}')

        # Check that the code is alright.
        code = request.args.get('code')
        if not code:
            return redirect(f'auth-failed?error=no-code')

        # Check that the state is alright.
        state = request.args.get('state')
        if not state:
            return redirect(f'auth-failed?error=no-state')
        elif ';' not in state:
            return redirect(f'auth-failed?error=malformed-state')

        device_id, return_url = state.split(';', maxsplit=2)

        # Log in with Reddit.
        try:
            reddit = praw.Reddit(**config['webapp-credentials'])
            reddit.auth.authorize(code)

            redditor = reddit.user.me()
        except prawcore.exceptions.OAuthException as e:
            send_to_log(f'Failed to log into reddit with error: {e}')
            raise

        # Check that the user meetings the eligibility requirements.
        if not device_index.is_eligible(redditor):
            data = {
                'error': 'requirements-not-met',
                'requirements': json.dumps(device_index.check_requirements(redditor))
            }
            return redirect(f'auth-failed?{url_encode(data)}')

        # Associate the device ID with the Redditor's username.
        device_index.register(device_id, redditor.name)

        # The user has been authenticated. Time to redirect.
        return redirect(return_url)

    @app.route('/<path:path>')
    def send_build(path):
        try:
            return send_from_directory('../front-end/build', path)
        except NotFound:
            return app.send_static_file('index.html')

    @app.route('/')
    def root():
        return app.send_static_file('index.html')

    return app
