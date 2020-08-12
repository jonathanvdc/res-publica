/**
 * An interface for objects that handle user authentication.
 */
export interface Authenticator {
    /**
     * Tests if this device is authenticated.
     */
    isAuthenticated(): Promise<boolean>;

    /**
     * Creates an authentication page.
     */
    createAuthenticationPage(): JSX.Element;
}

function makeid(length: number): string {
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

/**
 * Gets a unique identifier for this device.
 */
export function getDeviceId(): string {
    const key = "deviceId";
    let val = localStorage.getItem(key);
    if (val) {
        return val;
    } else {
        val = makeid(20);
        localStorage.setItem(key, val);
        return val;
    }
}
