import { Authenticator } from "./auth";

/**
 * A client that allows the application to interact with the server's API.
 */
export interface APIClient {
    /**
     * Gets an authenticator appropriate for this API client.
     */
    getAuthenticator(): Authenticator;
}
