#!/usr/bin/env python3

from datetime import datetime, timezone
from pathlib import Path
import json
import subprocess

def read_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def write_json(data, path):
    with open(path, 'w') as f:
        return json.dump(data, f, indent=4)

def send_to_log(string):
    print(string)

def start_and_monitor(args, log_file_prefix='server'):
    """Starts a program and sends its output to a log."""
    time_string = datetime.now(timezone.utc).strftime('%Y%m%d%H%M')
    Path('logs').mkdir(parents=True, exist_ok=True)
    log = open(f'logs/{log_file_prefix}-{time_string}.log', 'a')
    subprocess.Popen(args=args, stdout=log, stderr=log, stdin=subprocess.DEVNULL)
