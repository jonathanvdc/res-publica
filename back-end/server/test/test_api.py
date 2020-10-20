#!/usr/bin/env python3

import os
import shutil
import tempfile
import pytest
from ..server import create_app

@pytest.fixture
def client():
    test_log_dir = tempfile.mkdtemp()
    test_file_name = tempfile.mktemp('json')
    with create_app({}, test_file_name, test_log_dir).test_client() as client:
        yield client

    shutil.rmtree(test_log_dir)
    try:
        os.unlink(test_file_name)
    except FileNotFoundError:
        # Who cares.
        pass

def test_main_page(client):
    """Tests that the server will serve the main page."""

    rv = client.get('/')
    assert rv.data.startswith(b'<!DOCTYPE HTML PUBLIC')
