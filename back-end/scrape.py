#!/usr/bin/env python3

"""Defines routines for creating votes by scraping a Reddit CFC."""

import time
import sys
from praw import Reddit
from typing import Any, List, Union
from helpers import read_json


Vote = Any
VoteOption = Any

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
    without_prefix = strip_reddit_prefix(candidate_name.strip())
    split = split_on_one_of(without_prefix, affiliation_separators, 1)
    if len(split) == 1:
        return { "name": without_prefix.strip() }
    else:
        username, party = split
        return { "name": username.strip(), "affiliation": party.strip() }

def parse_cfc(body: str, is_presidential: bool = False, discern_candidates: bool = False) -> Union[VoteOption, None]:
    """Parses a CFC."""
    split_body = body.strip().split('\n', maxsplit=1)
    if len(split_body) < 2:
        return None

    header, description = split_body
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
        if is_presidential:
            # The CFC format for presidential CFCs is
            # /u/YourRedditUsername - Your political party | /u/YourVicePresidentUsername - Their political party
            split = split_on_one_of(header, ['|', '/'], 1)
            if len(split) == 1:
                option['ticket'] = [parse_candidate(header, ['\\-', '- '])]
            else:
                first_candidate, second_candidate = split
                option['ticket'] = [
                    parse_candidate(first_candidate, ['\\-', '- ']),
                    parse_candidate(second_candidate, ['\\-', '- '])
                ]
        else:
            # The CFC format for senatorial CFCs is
            # /u/YourRedditUsername | Your political party
            option['ticket'] = [parse_candidate(header, ['|', '\\', '/'])]

    return option


def scrape_cfc(reddit: Reddit, url: str, discern_candidates: bool = False) -> Vote:
    """Scrapes a CFC from Reddit."""

    post = reddit.submission(url=url)

    # Parse the title.
    title = post.title
    for cfc_indicator in ('cfc', 'call for candidates'):
        if title.lower().endswith(cfc_indicator):
            title = title[:-len(cfc_indicator)]
        elif title.lower().startswith(cfc_indicator):
            title = title[len(cfc_indicator):]

        title = title.strip().strip(':').strip()

    is_presidential = 'president' in title.lower()

    # Grab the options.
    options = []
    for top_level_comment in post.comments:
        if top_level_comment.author.name.lower() == 'automoderator':
            # Skip AutoModerator posts.
            continue

        option = parse_cfc(
            top_level_comment.body,
            is_presidential=is_presidential,
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
        scrape_cfc(
            Reddit(**credentials),
            'https://www.reddit.com/r/SimDemocracy/comments/i9qudc/39th_senatorial_vote_call_for_candidates/',
            True))
