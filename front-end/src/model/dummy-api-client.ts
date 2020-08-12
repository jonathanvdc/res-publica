import { Authenticator } from "./auth";
import { DummyAuthenticator } from "./dummy-auth";
import { APIClient } from "./api-client";

/**
 * An API client that fakes all interactions with the server.
 */
export class DummyAPIClient implements APIClient {
    /**
     * Gets an authenticator appropriate for this API client.
     */
    getAuthenticator(): Authenticator {
        return new DummyAuthenticator();
    }
}
