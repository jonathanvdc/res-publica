#!/usr/bin/env python3

import os
import shutil
import tempfile
import pytest
from ..server import create_app

@pytest.fixture
def client():
    test_config = {
        'webapp-credentials': {
            'client_id': 'test'
        }
    }

    test_log_dir = tempfile.mkdtemp()
    test_file_name = tempfile.mktemp('json')
    with create_app(test_config, test_file_name, test_log_dir).test_client() as client:
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
    assert rv.data.startswith(b'<!doctype html>')

def test_empty_vote_list(client):
    """Tests that the server can return an empty list of votes."""
    rv = client.post('/api/core/all-votes')
    assert len(rv.json) == 0

def test_get_client_id(client):
    """Tests that the server can return an empty list of votes."""
    rv = client.get('/api/core/client-id')
    assert rv.json == 'test'

def test_not_initially_authenticated(client):
    """Tests that the server can return an empty list of votes."""
    rv = client.post('/api/core/is-authenticated', json={
        'deviceId': 'test'
    })
    assert rv.json == 'unauthenticated'
