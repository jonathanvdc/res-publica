#!/usr/bin/env python3

"""Provides a very basic temporary server to users, while the actual server is upgrading/restarting."""

import sys
from flask import Flask, make_response
from server.persistence.helpers import read_json


def main(config_path):
    app = Flask(__name__)

    @app.route('/')
    @app.route('/<path:path>')
    def root(path):
        response = make_response(f"You tried to access the site, but the server is not ready yet. Try again later.")
        response.status_code = 503

        return response

    config = read_json(config_path)
    app.run(**config.get('host', {}))


if __name__ == '__main__':
    main(sys.argv[1])
