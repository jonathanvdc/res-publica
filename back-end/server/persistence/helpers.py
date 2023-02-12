#!/usr/bin/env python3

import json
from datetime import datetime

log_name = f"actions-{datetime.now().strftime('%d %m %Y - %H %M %S')}.log"

def read_json(path):
    with open(path, 'r') as f:
        return json.load(f)


def write_json(data, path):
    with open(path, 'w') as f:
        return json.dump(data, f, indent=4)


def send_to_log(string, name, level='ERROR'):
    with open(log_name, "a+") as f:
        now = datetime.now()
        asctime = now.strftime('%d.%m.%Y %H:%M:%S %Z')
        f.write(f"{name} | {level} | {asctime}\t\t{string}")
