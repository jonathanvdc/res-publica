#!/usr/bin/env python3

"""Upgrades and starts the server."""

import os
import socket
import sys
import subprocess
from helpers import read_json

def is_port_in_use(port):
    """Tells if a port is in use."""
    # This implementation is based on Rugnar's answer to
    # "Fast way to test if a port is in use using Python"
    # on StackOverflow
    # (https://stackoverflow.com/questions/2470971/fast-way-to-test-if-a-port-is-in-use-using-python).
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def main(config_path):
    """The script's entry point. Takes a path to the config file."""
    config = read_json(config_path)

    # Wait for the server to shut down.
    while is_port_in_use(config.get('host', {}).get('port', 8000)):
        pass

    parent_path = os.path.join(os.path.realpath(__file__), '..')

    # Build the front-end.
    subprocess.check_call(
        ['npm', 'run-script', 'build'],
        cwd=os.path.realpath(os.path.join(parent_path, '..', 'front-end')))

    # Restart the server.
    log = open('server.log', 'a')
    subprocess.Popen(args=[
        'python3',
        os.path.realpath(os.path.join(parent_path, 'server.py')),
        os.path.realpath(config_path)
    ], stdout=log, stderr=log, stdin=subprocess.DEVNULL)

if __name__ == "__main__":
    main(sys.argv[1])
