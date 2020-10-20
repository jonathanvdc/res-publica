#!/usr/bin/env python3

"""A top-level script that manages the server.
   When the server shuts down, the server manager may upgrade and restart the server if requested."""

import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime, timezone
from helpers import read_json, write_json


def run_and_monitor(args, log_file_prefix='server'):
    """Runs a program to completion and sends its output to a log."""
    time_string = datetime.now(timezone.utc).strftime('%Y%m%d%H%M')
    Path('logs').mkdir(parents=True, exist_ok=True)
    log = open(f'logs/{log_file_prefix}-{time_string}.log', 'a')
    return subprocess.check_call(args, stdout=log, stderr=log, stdin=subprocess.DEVNULL)

def main(config_path):
    back_end_path = os.path.realpath(os.path.join(os.path.realpath(__file__), '..'))

    restart = True
    while restart:
        restart = False

        # Upgrade the server.
        print(' >>> Upgrading server')
        upgrade_script = os.path.realpath(os.path.join(os.path.realpath(__file__), '..', 'upgrade.py'))
        run_and_monitor(['python3', upgrade_script], log_file_prefix='upgrade')

        # Clear message-in-a-bottle file.
        bottle_path = 'logs/bottle.log'
        write_json({}, bottle_path)

        # Start the server. Give it a file so it can pass us a final message if it wants to.
        print(' >>> Starting server')
        try:
            run_and_monitor([
                'python3',
                os.path.join(back_end_path, 'server.py'),
                os.path.realpath(config_path),
                bottle_path
            ])
        except subprocess.CalledProcessError:
            # Ignore nonzero exit codes.
            pass

        # Read message in the bottle, if any.
        message = read_json(bottle_path)
        if message.get('action') == 'restart':
            restart = True
            print(' >>> Restart requested')
        else:
            print(' >>> Goodbye!')

if __name__ == "__main__":
    main(sys.argv[1])
