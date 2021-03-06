#!/usr/bin/env python3

"""A top-level script that manages the server.
   When the server shuts down, the server manager may upgrade and restart the server if requested."""

import os
import sys
import subprocess
import time
from pathlib import Path
from datetime import datetime, timezone
from server.persistence.helpers import read_json, write_json

def run_and_monitor(args, log_file_prefix='server'):
    """Runs a program to completion and sends its output to a log."""
    time_string = datetime.now(timezone.utc).strftime('%Y%m%d%H%M')
    Path('logs').mkdir(parents=True, exist_ok=True)
    log = open(f'logs/{log_file_prefix}-{time_string}.log', 'a')
    return subprocess.check_call(args, stdout=log, stderr=log, stdin=subprocess.DEVNULL)

def main(config_path):
    back_end_path = os.path.realpath(os.path.join(os.path.realpath(__file__), '..'))

    # Because on Windows machines python is usually installed as 'python' but UNIX rather uses 'python3' and 'python' refers to py2
    if os.name == 'nt':
        python = 'python'
    elif os.name == 'posix':
        python = 'python3'
    else:
        python = 'python'
    
    restart = True
    while restart:
        restart = False

        # Create a lock file and start the provisional server.
        if not os.path.isfile("server.lock"):
            open("server.lock","x")
            provisional_server = os.path.realpath(os.path.join(os.path.realpath(__file__), '..', 'provisional-server.py'))
            prov_server_proc = subprocess.Popen([python, provisional_server])
        else:
            raise RuntimeError("There should be no running server, but a server.lock file exists.")

        # Upgrade the server.
        print(' >>> Upgrading server')
        upgrade_script = os.path.realpath(os.path.join(os.path.realpath(__file__), '..', 'upgrade.py'))
        run_and_monitor([python, upgrade_script], log_file_prefix='upgrade')

        # Stop the provisional server (forcefully terminate if it doesn't stop after 10 seconds). Then delete the server lock.
        prov_server_proc.kill()
        try:
            prov_server_proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            prov_server_proc.terminate()
            
        os.remove("server.lock")

        # Clear message-in-a-bottle file.
        bottle_path = 'logs/bottle.log'
        write_json({}, bottle_path)

        # Start the server. Give it a file so it can pass us a final message if it wants to.
        print(' >>> Starting server')
        try:
            run_and_monitor([
                python,
                os.path.join(back_end_path, 'start-server.py'),
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
