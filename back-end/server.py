#!/usr/bin/env python3

from flask import Flask, request, send_from_directory

app = Flask(__name__, static_folder='../front-end/build')

@app.route('/<path:path>')
def send_build(path):
    return send_from_directory('../front-end/build', path)

@app.route('/')
def root():
    return app.send_static_file('index.html')

app.run(debug=True)
