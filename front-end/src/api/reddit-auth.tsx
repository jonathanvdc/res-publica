import React from 'react';
import RedditAuthPage from "../components/pages/reddit-auth-page";
import { Authenticator, getDeviceId, AuthenticationLevel, refreshDeviceId } from "./auth";
import { NetworkError } from '../model/exceptions';
import { postJSON } from './api-client';

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
    isAuthenticated(): Promise<AuthenticationLevel> {
        return postJSON('/api/is-authenticated', {
            deviceId: this.deviceId
        });
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

    getUserId(): Promise<string> {
        return postJSON('/api/user-id', {
            deviceId: this.deviceId
        });
    }

    get deviceId(): string {
        return this.deviceIdVal;
    }

    private deviceIdVal: string;
    private redirectUrl: string;
}
