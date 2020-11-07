#!/usr/bin/env python3

"""Defines routines for creating votes by scraping a Reddit CFC."""

import time
import sys
import json
import praw.exceptions
from praw import Reddit
from bs4 import BeautifulSoup
from markdown import markdown
from typing import Any, List, Union
from .persistence.helpers import read_json, send_to_log


Vote = Any
VoteOption = Any

def markdown_to_plain_text(markdown_text: str) -> str:
    # Base on Jason Coon's answer to Krish's StackOverflow
    # question on how to convert markdown formatted text to text:
    # https://stackoverflow.com/questions/761824/python-how-to-convert-markdown-formatted-text-to-text
    html = markdown(markdown_text)
    return ''.join(BeautifulSoup(html, features='html.parser').findAll(text=True))

def strip_reddit_prefix(username: str) -> str:
    username = username.lstrip('/')
    if username.lower().startswith('u/'):
        username = username[2:]

    return username

def split_on_one_of(value: str, separators: List[str], maxsplit=None) -> str:
    for sep in separators:
        split = value.split(sep, maxsplit=maxsplit)
        if len(split) > 1:
            return split

    return [value]

def parse_candidate(candidate_name: str, affiliation_separators: List[str]):
    without_prefix = strip_reddit_prefix(candidate_name.strip().strip(''.join(affiliation_separators)))
    split = split_on_one_of(without_prefix, affiliation_separators, 1)
    if len(split) == 1:
        return { "name": without_prefix.strip() }
    else:
        username, party = split
        return { "name": username.strip(), "affiliation": party.strip() }

def parse_cfc(body: str, discern_candidates: bool = False) -> Union[VoteOption, None]:
    """Parses a CFC."""
    split_body = body.strip().split('\n', maxsplit=1)
    if len(split_body) < 2:
        return None

    header, description = split_body
    header = markdown_to_plain_text(header)
    candidate_name = header.strip().split()[0]
    candidate_id = strip_reddit_prefix(candidate_name.lower())
    candidate_id = candidate_id.strip('|/\\')

    option = {
        'id': candidate_id,
        'name': header.strip(),
        'description': description.strip('\n')
    }

    if discern_candidates:
        # Note: Sometimes people use a slash instead of a bar for their CFCs (how vexing).
        # The format for CFCs is
        # /u/YourRedditUsername | Your political party
        option['ticket'] = [parse_candidate(header, ['|', '\\', '/', '-'])]

    return option


def scrape_cfc(reddit: Reddit, url: str, discern_candidates: bool = False) -> Vote:
    """Scrapes a CFC from Reddit."""

    try:
        post = reddit.submission(url=url)
    except praw.exceptions.InvalidURL:
        send_to_log('Invalid URL passed to scrape_cfc!')
        raise

    # Parse the title.
    title = post.title
    for cfc_indicator in ('cfc', 'call for candidates'):
        if title.lower().endswith(cfc_indicator):
            title = title[:-len(cfc_indicator)]
        elif title.lower().startswith(cfc_indicator):
            title = title[len(cfc_indicator):]

        title = title.strip().strip(':').strip()

    # Grab the options.
    options = []
    for top_level_comment in post.comments:
        if not top_level_comment.author or top_level_comment.author.name.lower() == 'automoderator':
            # Skip AutoModerator posts and posts by deleted accounts.
            continue

        option = parse_cfc(
            top_level_comment.body,
            discern_candidates=discern_candidates)
        if option is None:
            continue

        options.append(option)

    return {
        'id': 'new-vote',
        'name': title,
        'description': 'A vote on something.',
        'deadline': time.time() + 60 * 60 * 24,
        'options': options,
        'type': {
            'tally': 'spsv',
            'positions': 7,
            'min': 0,
            'max': 5
        }
    }


if __name__ == "__main__":
    # This script is designed to be used by the server, but it can be used
    # directly to test scraping.
    credentials = read_json(sys.argv[1])['bot-credentials']
    print(
        json.dumps(
            scrape_cfc(
                Reddit(**credentials),
                'https://www.reddit.com/r/SimDemocracy/comments/ii9w21/40th_senatorial_election_call_for_candidates/',
                True),
            indent=4))
