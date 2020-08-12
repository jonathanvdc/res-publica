import React from 'react';
import RedditAuthPage from "../components/reddit-auth-page";
import { Authenticator, getDeviceId } from "./auth";
import { NetworkError } from './exceptions';

/**
 * A type that handles Reddit authentication.
 */
export class RedditAuthenticator implements Authenticator {
    /**
     * Creates a Reddit authenticator.
     * @param clientId The client ID to use.
     * @param redirectUrl The client's redirect URL.
     * @param deviceId A device ID for the current device.
     */
    constructor(clientId?: string, redirectUrl?: string, deviceId?: string) {
        this.deviceId = deviceId || getDeviceId();
        this.clientId = clientId || "AvYTCpbWRP5rbA";
        this.redirectUrl = redirectUrl || window.location.origin + "/reddit-auth";
    }

    /**
     * Tests if this device is authenticated.
     */
    async isAuthenticated(): Promise<boolean> {
        const response = await fetch(`/api/is-authenticated?deviceId=${encodeURIComponent(this.deviceId)}`);
        if (response.ok) {
            return await response.json();
        } else {
            throw new NetworkError(response);
        }
    }

    /**
     * Creates an authentication page.
     */
    createAuthenticationPage(): JSX.Element {
        return <RedditAuthPage clientId={this.clientId} redirectUrl={this.redirectUrl} deviceId={this.deviceId} />;
    }

    private deviceId: string;
    private clientId: string;
    private redirectUrl: string;
}
