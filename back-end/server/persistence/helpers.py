#!/usr/bin/env python3

import os
import json
from datetime import datetime

log_name = f"actions-{datetime.now().strftime('%d%m%Y %H-%M-%S')}.log"
log_folder = "logs"

def read_json(path):
    with open(path, 'r') as f:
        return json.load(f)


def write_json(data, path):
    with open(path, 'w') as f:
        return json.dump(data, f, indent=4)


def send_to_log(string, name, level='ERROR'):
    if not os.path.exists(log_folder):
        os.makedirs(log_folder)

    with open(os.path.join(log_folder, log_name), 'a+') as f:
        now = datetime.now()
        asctime = now.strftime('%d.%m.%Y %H:%M:%S %Z')
        f.write(f"{name} | {level} | {asctime}\t\t{string}\n")
