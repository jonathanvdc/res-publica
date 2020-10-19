#!/usr/bin/env python3

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

def start_and_monitor(*args, log_file='server.log'):
    """Starts a program and sends its output to a log."""
    log = open(log_file, 'a')
    subprocess.Popen(args=args, stdout=log, stderr=log, stdin=subprocess.DEVNULL)
