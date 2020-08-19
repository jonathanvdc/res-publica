#!/usr/bin/env python3

import time
from collections import defaultdict
from pathlib import Path
from typing import Dict
from helpers import read_json, write_json


DeviceId = str
UserId = str


# Allow devices to stay registered for thirty days until they expire.
SECONDS_UNTIL_EXPIRY = 60 * 60 * 24 * 30


class RegisteredDevice(object):
    """A class that represents a device ID registered with a particular user."""
    def __init__(self, device_id: DeviceId, user_id: UserId, expiry: float):
        self.device_id = device_id
        self.user_id = user_id
        self.expiry = expiry

    def is_alive(self) -> bool:
        """Tests if this registered device has not yet expired."""
        return self.expiry <= time.monotonic()


class DeviceIndex(object):
    """An index that keeps track of all registered devices."""
    def __init__(self, devices: Dict[DeviceId, RegisteredDevice], persistence_path: str):
        self.persistence_path = persistence_path
        self.devices = devices
        self.users_to_devices = defaultdict(set)
        self.users_to_devices.update({
            user_id: set(device for device in devices.values() if device.user_id == user_id)
            for user_id in set(data.user_id for data in devices.values())
        })

    def register(self, device_id: DeviceId, user_id: UserId) -> RegisteredDevice:
        """Adds a new device to this device index."""
        self.unregister(device_id, persist_changes=False)

        device = RegisteredDevice(device_id, user_id, time.monotonic() + SECONDS_UNTIL_EXPIRY)
        self.devices[device_id] = device
        self.users_to_devices[user_id].add(device)

        write_device_index(self, self.persistence_path)

        return device

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


def read_device_index(path: str) -> DeviceIndex:
    """Reads the device index from a file."""
    data = read_json(path)
    devices = {
        device_id: RegisteredDevice(device_id, info['user'], info['expiry'])
        for device_id, info in data.items()
    }
    return DeviceIndex(devices, path)


def read_or_create_device_index(path: str) -> DeviceIndex:
    """Reads the device index from a file or creates a fresh index if there is no such file."""
    try:
        return read_device_index(path)
    except FileNotFoundError:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        return DeviceIndex({}, path)


def write_device_index(index: DeviceIndex, path: str):
    """Writes the device index to a file."""
    data = {
        device_id: {
            'user': device.user_id,
            'expiry': device.expiry
        }
        for device_id, device in index.devices.items()
    }
    write_json(data, path)