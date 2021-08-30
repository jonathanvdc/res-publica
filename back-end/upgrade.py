#!/usr/bin/env python3

"""Upgrades the server."""

import os
import subprocess


def main():
    """The script's entry point."""

    # Compute paths.
    parent_path = os.path.realpath(os.path.join(os.path.realpath(__file__), '..'))
    front_end_path = os.path.realpath(os.path.join(parent_path, '..', 'front-end'))
    print(front_end_path)

    # Run a git pull.
    subprocess.check_call(['git', 'pull'], cwd=parent_path, shell=True)

    # Install npm packages.
    subprocess.check_call(['npm', 'install'], cwd=front_end_path, shell=True)

    # Build the front-end.
    subprocess.check_call(['npm', 'run-script', 'build'], cwd=front_end_path, shell=True)

    # Install Python packages.
    subprocess.check_call(['pip3', 'install', '-r', 'requirements.txt'], cwd=parent_path, shell=True)


if __name__ == "__main__":
    main()
