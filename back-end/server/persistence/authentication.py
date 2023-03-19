#!/usr/bin/env python3

import time
from datetime import date
from collections import defaultdict
from pathlib import Path
from typing import Dict, Set, List, Optional, Any
from .helpers import read_json, write_json, send_to_log

DeviceId = str
UserId = str
DeviceInfo = Any
VoterRequirement = Any

# Allow devices to stay registered for thirty days until they expire.
# This is kept to provide backward compatibility with older configs, so the server does not bug out after an upgrade.
SECONDS_UNTIL_EXPIRY = 60 * 60 * 24 * 30

OPERATORS = {
    '>=': lambda x, y: x >= y,
    '<=': lambda x, y: x <= y,
    '==': lambda x, y: x == y,
    '!=': lambda x, y: x != y,
    '>': lambda x, y: x > y,
    '<': lambda x, y: x > y
}

OPERANDS = {
    'redditor.age': lambda redditor: (date.today() - date.fromtimestamp(redditor.created_utc)).days,
    'redditor.total_karma': lambda redditor: redditor.link_karma + redditor.comment_karma
}

PERMISSIONS = {
    'vote': [
        'view',
        'cast',
    ],
    'election': [
        'create',
        'edit',
        'cancel',
        'view-suspicious-ballots',
    ],
    'usermanagement': [
        'view',
        'add',
        'remove',
    ],
    'administration': [
        'edit-permissions',
        'upgrade-server',
    ]
}

class RegisteredDevice(object):
    """A class that represents a device ID registered with a particular user."""

    def __init__(self, device_id: DeviceId, device_info: DeviceInfo, user_id: UserId, expiry: float):
        self.device_id = device_id
        self.device_info = device_info
        self.user_id = user_id
        self.expiry = expiry

    def persistent_id(self) -> Optional[str]:
        """Gets this device's persistent ID."""
        return self.device_info.get('persistentId')

    def description(self) -> Optional[Any]:
        """Gets this device's description."""
        return self.device_info.get('description')

    def visitor_id(self) -> Optional[str]:
        """Gets this device's visitor ID."""
        description = self.description()
        if description:
            return description['visitorId']
        else:
            return None

    def is_alive(self) -> bool:
        """Tests if this registered device has not yet expired."""
        return self.expiry >= time.monotonic()

    def to_json(self) -> Any:
        """Creates a JSON representation of this device ID."""
        return {
            'id': self.device_id,
            'user': self.user_id,
            'expiry': self.expiry,
            'info': self.device_info
        }


class DeviceIndex(object):
    """An index that keeps track of all registered devices."""

    def __init__(
            self,
            devices: Dict[DeviceId, RegisteredDevice],
            permissions: Dict[any, Set[UserId]],
            admins: Set[UserId],
            developers: Set[UserId],
            registered_voters: Set[UserId],
            voter_requirements: List[VoterRequirement],
            persistence_path: str):

        self.persistence_path = persistence_path
        self.devices = devices
        self.permissions = permissions
        self.admins = admins
        self.developers = developers
        self.registered_voters = registered_voters
        self.voter_requirements = voter_requirements    
        self.users_to_devices = defaultdict(set)
        self.users_to_devices.update({
            user_id: set(device for device in devices.values() if device.user_id == user_id)
            for user_id in set(data.user_id for data in devices.values())
        })

    def register(self, device_id: DeviceId, user_id: UserId, device_info: DeviceInfo, expiry: float = SECONDS_UNTIL_EXPIRY) -> RegisteredDevice:
        """Adds a new device to this device index."""
        self.unregister(device_id, persist_changes=False)

        device = RegisteredDevice(device_id, device_info, user_id, time.monotonic() + expiry)
        self.devices[device_id] = device
        self.users_to_devices[user_id].add(device)
        self.register_user(user_id, persist_changes=False)

        write_device_index(self, self.persistence_path)

        return device

    def register_user(self, user_id: UserId, persist_changes: bool = True):
        """Adds a new user to the device index, but does not add an associated device."""
        self.registered_voters.add(user_id)

        if persist_changes:
            write_device_index(self, self.persistence_path)

    def unregister_user(self, user_id: UserId, persist_changes: bool = True):
        """Removes a user from the device index. Removes any associated devices."""
        self.registered_voters.remove(user_id)
        for device in self.users_to_devices[user_id]:
            try:
                del self.devices[device.device_id]
            except KeyError:
                send_to_log(f'Attempted to delete nonexistent device {device.device_id}', 'authentication')
                raise

        del self.users_to_devices[user_id]

        if persist_changes:
            write_device_index(self, self.persistence_path)

    def check_requirements(self, redditor) -> list:
        """Tests if a Redditor is eligible to vote."""

        def parse_operand(operand):
            if isinstance(operand, str):
                return OPERANDS[operand](redditor)
            else:
                return operand

        return [
            (req, OPERATORS[req['operator']](parse_operand(req['lhs']), parse_operand(req['rhs'])))
            for req in self.voter_requirements
        ]

    def is_eligible(self, redditor) -> bool:
        """Tests if a Redditor is eligible to vote."""
        return redditor.name in self.registered_voters or all(v for _, v in self.check_requirements(redditor))

    def unregister(self, device_id: DeviceId, persist_changes: bool = True) -> bool:
        """Unregisters a device, if it was registered."""
        if device_id in self.devices:
            device = self.devices[device_id]
            del self.devices[device_id]
            self.users_to_devices[device.user_id].remove(device)

            if persist_changes:
                write_device_index(self, self.persistence_path)

            return True
        else:
            return False
        
    def add_permission(self, permission, user_id: UserId, persist_changes: bool = True):
        """Adds a permission to a user."""
        self.permissions[permission].add(user_id)

        if persist_changes:
            write_device_index(self, self.persistence_path)

    def remove_permission(self, permission, user_id: UserId, persist_changes: bool = True) -> bool:
        """Removes a permission from a user."""
        if permission(user_id):
            self.permissions[permission].remove(user_id)

            if persist_changes:
                write_device_index(self, self.persistence_path)
        
            return True
        else:
            return False
        

class Permission(object):
    """A permission that can be granted to a user. Valid permissions are pre-defined in the PERMISSIONS constant."""
    
    # Related to voting
    VOTE_VIEW = None
    VOTE_CAST = None

    # Related to election management
    ELECTION_CREATE = None
    ELECTION_EDIT = None
    ELECTION_CANCEL = None
    ELECTION_VIEW_SUSPICIOUS_BALLOTS = None

    # Related to users themselves
    USERMANAGEMENT_VIEW = None
    USERMANAGEMENT_ADD = None
    USERMANAGEMENT_REMOVE = None

    # Related to the server and highly sensitive actions
    ADMINISTRATION_EDIT_PERMISSIONS = None
    ADMINISTRATION_UPGRADE_SERVER = None

    def check_permission_validity(scope: str, permission: str):
        return permission in PERMISSIONS.get(scope, {})
    
    def __init__(self, scope: str, permission: str):
        if not Permission.check_permission_validity(scope, permission):
            raise ValueError(f'Invalid permission: {scope}.{permission}')
        
        self.scope = scope
        self.permission = permission

    def __eq__(self, other):
        return self.scope == other.scope and self.permission == other.permission

    def __hash__(self):
        return hash((self.scope, self.permission))

    def __str__(self):
        return f'{self.scope}.{self.permission}'
    
    def __repr__(self):
        return f'Permission({self.scope}.{self.permission})'
    
    def __call__(self, user_id: UserId, device_index: DeviceIndex) -> bool:
        """Checks if a user has this permission."""
        return user_id in device_index.permissions.get(self, set())

Permission.VOTE_VIEW = Permission('vote', 'view')
Permission.VOTE_CAST = Permission('vote', 'cast')
Permission.ELECTION_CREATE = Permission('election', 'create')
Permission.ELECTION_EDIT = Permission('election', 'edit')
Permission.ELECTION_CANCEL = Permission('election', 'cancel')
Permission.ELECTION_VIEW_SUSPICIOUS_BALLOTS = Permission('election', 'view-suspicious-ballots')
Permission.USERMANAGEMENT_VIEW = Permission('usermanagement', 'view')
Permission.USERMANAGEMENT_ADD = Permission('usermanagement', 'add')
Permission.USERMANAGEMENT_REMOVE = Permission('usermanagement', 'remove')
Permission.ADMINISTRATION_EDIT_PERMISSIONS = Permission('administration', 'edit-permissions')
Permission.ADMINISTRATION_UPGRADE_SERVER = Permission('administration', 'upgrade-server')


def read_device_index(path: str, voter_requirements: List[VoterRequirement]) -> DeviceIndex:
    """Reads the device index from a file."""

    # Read devices from JSON.
    data = read_json(path)
    devices = {
        device_id: RegisteredDevice(device_id, info.get('info'), info['user'], info['expiry'])
        for device_id, info in data['devices'].items()
    }

    # Discard devices that are no longer valid.
    devices = { device_id: device for device_id, device in devices.items() if device.is_alive() }

    # Read permissions from JSON.
    permissions = {}
    scopes = data.get('permissions', {})
    for scope in scopes:
        for permission in scopes[scope]:
            if Permission.check_permission_validity(scope, permission):
                permissions[Permission(scope, permission)] = set(scopes[scope][permission])

    # Assemble the device index.
    return DeviceIndex(
        devices,
        permissions,
        set(data.get('admins', [])),
        set(data.get('developers', [])),
        set(data.get('registered-voters', [])).union(info.user_id for info in devices.values()),
        voter_requirements,
        path)


def read_or_create_device_index(path: str, voter_requirements: List[VoterRequirement]) -> DeviceIndex:
    """Reads the device index from a file or creates a fresh index if there is no such file."""
    try:
        return read_device_index(path, voter_requirements)
    except FileNotFoundError:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        return DeviceIndex({}, {}, set(), set(), set(), voter_requirements, path)


def write_device_index(index: DeviceIndex, path: str):
    """Writes the device index to a file."""
    data = {
        device_id: device.to_json()
        for device_id, device in index.devices.items()
    }
    to_write = {
        'devices': data,
        'admins': list(sorted(index.admins)),
        'developers': list(sorted(index.developers)),
        'registered-voters': list(sorted(index.registered_voters))
    }
    write_json(to_write, path)
