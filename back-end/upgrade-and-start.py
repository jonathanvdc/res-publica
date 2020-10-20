#!/usr/bin/env python3

"""Upgrades and starts the server."""

import os
import socket
import sys
import subprocess
from helpers import read_json, start_and_monitor

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

    # Run a git pull.
    subprocess.check_call(['git', 'pull'])

    parent_path = os.path.join(os.path.realpath(__file__), '..')
    front_end_path = os.path.realpath(os.path.join(parent_path, '..', 'front-end'))

    # Build the front-end.
    subprocess.check_call(['npm', 'install'], cwd=front_end_path)
    subprocess.check_call(['npm', 'run-script', 'build'], cwd=front_end_path)

    # Install Python packages.
    subprocess.check_call(
        ['pip3', 'install', '-r', 'requirements.txt'],
        cwd=os.path.realpath(parent_path))

    # Restart the server.
    start_and_monitor([
        'python3',
        os.path.realpath(os.path.join(parent_path, 'server.py')),
        os.path.realpath(config_path)
    ])

if __name__ == "__main__":
    main(sys.argv[1])
