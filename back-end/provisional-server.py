#!/usr/bin/env python3

"""Provides a very basic temporary server to users, while the actual server is upgrading/restarting."""

import sys
from flask import Flask, make_response
from server.persistence.helpers import read_json

def main(config_path):
    app = Flask(__name__)

    @app.route('/')
    @app.route('/<path:path>')
    def root(path = ''):
        #TODO: Add a better solution to prevent XSS.
        #This is low priority, because the server will only ever be in this mode for short periods of time and 30 characters is low enough to prevent a lot of XSS.
        if len(path) < 30:
            response = make_response(f"You tried to access {path}, but the server is not ready yet. Try again later.")
        else:
            response = make_response(f"You tried to access a site, but the server is not ready yet. Try again later.")

        response.status_code = 503

        return response

    config = read_json(config_path)
    app.run(**config.get('host', {}))

if __name__ == '__main__':
    main(sys.argv[1])
