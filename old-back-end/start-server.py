#!/usr/bin/env python3

import sys
from server.server import create_app
from server.persistence.helpers import read_json

if __name__ == "__main__":
    config = read_json(sys.argv[1])
    bottle_path = sys.argv[2]
    create_app(config, bottle_path).run(**config.get('host', {'debug': True}))
