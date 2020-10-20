import React from 'react';
import RedditAuthPage from "../components/pages/reddit-auth-page";
import { Authenticator, getDeviceId, AuthenticationLevel, refreshDeviceId } from "./auth";
import { NetworkError } from './exceptions';

/**
 * A type that handles Reddit authentication.
 */
export class RedditAuthenticator implements Authenticator {
    /**
     * Creates a Reddit authenticator.
     * @param redirectUrl The client's redirect URL.
     * @param deviceId A device ID for the current device.
     */
    constructor(redirectUrl?: string, deviceId?: string) {
        this.deviceIdVal = deviceId || getDeviceId();
        this.redirectUrl = redirectUrl || window.location.origin + "/reddit-auth";
    }

    /**
     * Tests if this device is authenticated.
     */
    async isAuthenticated(): Promise<AuthenticationLevel> {
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
    async createAuthenticationPage(): Promise<JSX.Element> {
        let response = await fetch(`/api/client-id`);
        let clientId: string = await response.json();
        return <RedditAuthPage clientId={clientId} redirectUrl={this.redirectUrl} deviceId={this.deviceId} />;
    }

    logOut(): void {
        // We log out by refreshing our device ID.
        this.deviceIdVal = refreshDeviceId();
    }

    async getUserId(): Promise<string> {
        let response = await fetch(`/api/user-id?deviceId=${encodeURIComponent(this.deviceId)}`);
        return await response.json();
    }

    get deviceId(): string {
        return this.deviceIdVal;
    }

    private deviceIdVal: string;
    private redirectUrl: string;
}
