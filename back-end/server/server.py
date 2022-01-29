#!/usr/bin/env python3

import json
import base64
import logging
import os
from pathlib import Path
from typing import List

import praw
import prawcore.exceptions
from flask import Flask, request, redirect, send_from_directory, jsonify, abort
from werkzeug.exceptions import NotFound
from werkzeug.urls import url_encode

from .api.core import create_core_blueprint, get_auth_level
from .api.election_management import create_election_management_blueprint
from .persistence.authentication import read_or_create_device_index, RegisteredDevice
from .persistence.helpers import write_json, send_to_log
from .persistence.votes import read_or_create_vote_index
from .scrape import scrape_cfc

DEFAULT_STATIC_FOLDER = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))),
    'front-end',
    'build')


def create_app(config, bottle_path, data_path='data', static_folder=DEFAULT_STATIC_FOLDER):
    """Creates the server as a Flask app."""

    app = Flask(__name__, static_folder=static_folder)
    log_status = config.get('flask-logs')
    app.logger.disabled = not log_status
    log = logging.getLogger('werkzeug')
    log.disabled = not log_status

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

    def get_available_optional_apis(req) -> List[str]:
        return config.get('optional-apis', {}).get(get_auth_level(req, device_index), [])

    def can_access_optional_api(req, api_name) -> bool:
        return api_name in get_available_optional_apis(req)

    # Register the core APIs.
    app.register_blueprint(
        create_core_blueprint(device_index, vote_index),
        url_prefix='/api/core')

    # Add `/api/core/client-id` as a special case since it needs to peer deeply into the config.
    @app.route('/api/core/client-id')
    def get_client_id():
        return jsonify(config['webapp-credentials']['client_id'])

    # Register the election management APIs.
    app.register_blueprint(
        create_election_management_blueprint(device_index, vote_index),
        url_prefix='/api/election-management')

    # Add `/api/election-management/scrape-cfc` as a special case since it needs to peer deeply into the config.
    @app.route('/api/election-management/scrape-cfc', methods=['POST'])
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

        func = request.environ.get('werkzeug.server.shutdown')
        if func is None:
            raise RuntimeError('Not running with the Werkzeug Server')

        write_json({'action': 'restart'}, bottle_path)

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

        decoded_state = json.loads(base64.b64decode(state))
        if len(decoded_state) != 2:
            return redirect(f'auth-failed?error=malformed-state')

        device_info, return_url = decoded_state
        device_id = device_info['deviceId']

        # Log in with Reddit.
        try:
            reddit = praw.Reddit(**config['webapp-credentials'])
            reddit.auth.authorize(code)

            redditor = reddit.user.me()
        except prawcore.exceptions.OAuthException as e:
            send_to_log(f'Failed to log into reddit with error: {e}', name="server")
            raise

        # Don't allow suspended accounts to sign in.
        if redditor.is_suspended:
            return redirect(f'auth-failed?error=account-suspended')

        # Check that the user meetings the eligibility requirements.
        if not device_index.is_eligible(redditor):
            data = {
                'error': 'requirements-not-met',
                'requirements': json.dumps(device_index.check_requirements(redditor))
            }
            return redirect(f'auth-failed?{url_encode(data)}')

        # Associate the device ID with the Redditor's username.
        if "login_expiry" in config:
            device_index.register(device_id, redditor.name, device_info, config["login_expiry"])
        else:
            device_index.register(device_id, redditor.name, device_info)

        # The user has been authenticated. Time to redirect.
        return redirect(return_url)

    @app.route('/<path:path>')
    def send_build(path):
        try:
            return send_from_directory(static_folder, path)
        except NotFound:
            return app.send_static_file('index.html')

    @app.route('/')
    def root():
        return app.send_static_file('index.html')

    return app
