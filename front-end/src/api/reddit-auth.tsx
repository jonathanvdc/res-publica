import React from 'react';
import RedditAuthPage from "../components/pages/reddit-auth-page";
import { Authenticator, getDeviceId, AuthenticationLevel, refreshDeviceId, getPersistentDeviceId } from "./auth";
import { postJSON } from './api-client';
import { DeviceDescription } from '../model/voting/types';
import { Permission } from './api-client';

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
     * Gets all permissions that have been granted to this user.
     * @returns A list of permissions that have been granted to this user.
     */
    async getPermissions(): Promise<Permission[]> {
        let permissions = await postJSON('/api/core/get-permissions', {
            deviceId: this.deviceId
        });
        
        if (!permissions || !permissions.length) return [];
        return permissions.map((perm: string): Permission => perm as Permission);
    }

    /**
     * Checks if the user has been granted a specific permission.
     * @param scope The scope of the permission to check.
     * @param permission The permission to check.
     * @returns Whether or not the user has been granted the permission.
     */
    checkPermission(scope: string, permission: string | undefined): Promise<boolean> {
        return postJSON(`/api/core/check-permission`, {
            deviceId: this.deviceId,
            scope,
            permission
        });
    }

    /**
     * Creates an authentication page.
     */
    async createAuthenticationPage(deviceDescription: DeviceDescription): Promise<JSX.Element> {
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
