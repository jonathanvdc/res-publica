export class NetworkError extends Error {
    constructor(response: Response) {
        super(`Network error when accessing ${response.url}. Got status ${response.status} ${response.statusText}.`);

        // see: typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        this.name = NetworkError.name; // stack traces display correctly now 

        this.response = response;
    }

    public readonly response: Response;
}
