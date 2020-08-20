import React from 'react';
import { Authenticator, getDeviceId, AuthenticationLevel } from "./auth";

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
    async isAuthenticated(): Promise<AuthenticationLevel> {
        return AuthenticationLevel.AuthenticatedAdmin;
    }

    /**
     * Creates an authentication page.
     */
    createAuthenticationPage(): JSX.Element {
        return <div />;
    }

    logOut(): void {
        // Logging out isn't really a thing here. Do nothing?
    }

    async getUserId(): Promise<string> {
        return 'donald-duck';
    }

    public readonly deviceId: string;
}
