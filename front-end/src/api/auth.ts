import { DeviceDescription } from "../model/voting/types";

export enum AuthenticationLevel {
    Unauthenticated = "unauthenticated",
    Authenticated = "authenticated",
    AuthenticatedAdmin = "authenticated-admin",
    AuthenticatedDeveloper = "authenticated-developer"
}

/**
 * An interface for objects that handle user authentication.
 */
export interface Authenticator {
    /**
     * Tests if this device is authenticated.
     */
    isAuthenticated(): Promise<AuthenticationLevel>;

    /**
     * Creates an authentication page.
     * @param deviceDescription A description of the device that requests the authentication.
     */
    createAuthenticationPage(deviceDescription: DeviceDescription): Promise<JSX.Element>;

    /**
     * Gets the user's identifier (if they are authenticated).
     */
    getUserId(): Promise<string>;

    /**
     * Logs the user out, deleting their credentials.
     */
    logOut(): void;

    /**
     * Unregisters the user, deleting their account.
     */
    unregisterUser(): Promise<void>;
}

export function makeid(length: number): string {
    // Based on csharptest.net's answer to this StackOverflow question:
    // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const deviceIdKey = "deviceId";
const persistentDeviceIdKey = "persistentDeviceId";

/**
 * Gets a unique identifier for this device.
 */
export function getDeviceId(): string {
    let val = window.localStorage.getItem(deviceIdKey);
    if (val) {
        return val;
    } else {
        return refreshDeviceId();
    }
}

/**
 * Gets a unique identifier for this device.
 */
export function getPersistentDeviceId(): string {
    let val = window.localStorage.getItem(persistentDeviceIdKey);
    if (!val) {
        val = makeid(30);
        window.localStorage.setItem(persistentDeviceIdKey, val);
    }
    return val;
}

/**
 * Refreshes this device's unique identifier.
 */
export function refreshDeviceId(): string {
    let val = makeid(30);
    window.localStorage.setItem(deviceIdKey, val);
    return val;
}
