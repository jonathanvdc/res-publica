import React from 'react';
import RedditAuthPage from "../components/pages/reddit-auth-page";
import { Authenticator, getDeviceId, AuthenticationLevel, refreshDeviceId, getPersistentDeviceId } from "./auth";
import { postJSON } from './api-client';

/**
 * A type that handles Reddit authentication.
 */
export class RedditAuthenticator implements Authenticator {
    /**
     * Creates a Reddit authenticator.
     * @param redirectUrl The client's redirect URL.
     * @param deviceId An ephemeral device ID for the current device.
     * @param persistentId A persistent ID for the current device.
     */
    constructor(redirectUrl?: string, deviceId?: string, persistentId?: string) {
        this.deviceIdVal = deviceId || getDeviceId();
        this.persistentIdVal = persistentId || getPersistentDeviceId();
        this.redirectUrl = redirectUrl || window.location.origin + "/reddit-auth";
    }

    /**
     * Tests if this device is authenticated.
     */
    isAuthenticated(): Promise<AuthenticationLevel> {
        return postJSON('/api/core/is-authenticated', {
            deviceId: this.deviceId
        });
    }

    /**
     * Creates an authentication page.
     */
    async createAuthenticationPage(deviceDescription: any): Promise<JSX.Element> {
        let response = await fetch('/api/core/client-id');
        let clientId: string = await response.json();
        let deviceInfo = {
            deviceId: this.deviceId,
            persistentId: this.persistentIdVal,
            description: deviceDescription
        };
        return <RedditAuthPage clientId={clientId} redirectUrl={this.redirectUrl} deviceInfo={deviceInfo} />;
    }

    logOut(): void {
        // We log out by refreshing our device ID.
        this.deviceIdVal = refreshDeviceId();
    }

    async unregisterUser(): Promise<void> {
        // To unregister a user we need to send the server an account deletion request.
        await postJSON('/api/core/unregister-user', {
            deviceId: this.deviceId
        });

        // We should also delete our device ID.
        this.logOut();
    }

    getUserId(): Promise<string> {
        return postJSON('/api/core/user-id', {
            deviceId: this.deviceId
        });
    }

    get deviceId(): string {
        return this.deviceIdVal;
    }

    private deviceIdVal: string;
    private persistentIdVal: string;
    private redirectUrl: string;
}
