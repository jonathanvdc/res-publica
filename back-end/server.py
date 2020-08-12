#!/usr/bin/env python3

import sys
import praw
from collections import defaultdict
from Crypto.Hash import SHA3_256
from flask import Flask, request, redirect, send_from_directory, jsonify
from werkzeug.exceptions import NotFound
from authentication import read_or_create_device_index
from helpers import read_json

if __name__ == "__main__":
    config = read_json(sys.argv[1])
    app = Flask(__name__, static_folder='../front-end/build')

    device_index = read_or_create_device_index('data/device-index.json')

    @app.route('/api/is-authenticated')
    def check_is_authenticated():
        deviceId = request.args.get('deviceId')
        return jsonify(deviceId in device_index.devices)

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
        reddit = praw.Reddit(**config)
        reddit.auth.authorize(code)

        # Associate the device ID with the Redditor's username.
        device_index.register(device_id, reddit.user.me().name)

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

    app.run(debug=True)
