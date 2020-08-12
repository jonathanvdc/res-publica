import React from 'react';
import { Authenticator, getDeviceId } from "./auth";

/**
 * A type that handles pretends that the user is always signed in.
 */
export class DummyAuthenticator implements Authenticator {
    /**
     * Creates a dummy authenticator.
     * @param deviceId A device ID for the current device.
     */
    constructor(deviceId?: string) {
        this.deviceId = deviceId || getDeviceId();
    }

    /**
     * Tests if this device is authenticated.
     */
    async isAuthenticated(): Promise<boolean> {
        return true;
    }

    /**
     * Creates an authentication page.
     */
    createAuthenticationPage(): JSX.Element {
        return <div />;
    }

    public readonly deviceId: string;
}
