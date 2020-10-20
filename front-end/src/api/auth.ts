export enum AuthenticationLevel {
    Unauthenticated = "unauthenticated",
    Authenticated = "authenticated",
    AuthenticatedAdmin = "authenticated-admin"
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
     */
    createAuthenticationPage(): Promise<JSX.Element>;

    /**
     * Gets the user's identifier (if they are authenticated).
     */
    getUserId(): Promise<string>;

    /**
     * Logs the user out, deleting their credentials.
     */
    logOut(): void;
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

/**
 * Gets a unique identifier for this device.
 */
export function getDeviceId(): string {
    let val = localStorage.getItem(deviceIdKey);
    if (val) {
        return val;
    } else {
        return refreshDeviceId();
    }
}

/**
 * Refreshes this device's unique identifier.
 */
export function refreshDeviceId(): string {
    let val = makeid(30);
    localStorage.setItem(deviceIdKey, val);
    return val;
}
