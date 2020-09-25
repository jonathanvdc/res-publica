import { Authenticator } from "./auth";
import { VoteAndBallots, Ballot, Vote, FinishedBallot } from "./vote";

/**
 * A client that allows the application to interact with the server's API.
 */
export interface APIClient {
    /**
     * Gets an authenticator appropriate for this API client.
     */
    readonly authenticator: Authenticator;

    /**
     * Gets an API client for admin-related actions.
     */
    readonly admin: AdminAPIClient;

    /**
     * Gets an API client for the optional APIs.
     */
    readonly optional: OptionalAPIClient;

    /**
     * Gets all currently active votes.
     */
    getActiveVotes(): Promise<VoteAndBallots[]>;

    /**
     * Gets a list of all votes so far.
     */
    getAllVotes(): Promise<Vote[]>;

    /**
     * Gets a specific vote.
     */
    getVote(id: string): Promise<VoteAndBallots | undefined>;

    /**
     * Casts a ballot for an active vote. If the ballot was
     * submitted successfully, a unique identifier for the ballot
     * is returned that can be used to verify that the ballot was
     * indeed well received.
     */
    castBallot(voteId: string, ballot: Ballot): Promise<FinishedBallot | { error: string }>;
}

/**
 * An enumeration of APIs that the server might support or allow us to
 * access.
 */
export enum OptionalAPI {
    /**
     * An API that queries the set of registered voters.
     */
    registeredVoters = "registered-voters",
    /**
     * An API that registers a voter.
     */
    addRegisteredVoter = "add-registered-voter",
    /**
     * An API that unregisters a voter.
     */
    removeRegisteredVoter = "remove-registered-voter"
}

/**
 * An API client for optional APIs.
 */
export interface OptionalAPIClient {
    /**
     * Gets a list of all currently available optional APIs.
     */
    getAvailable(): Promise<OptionalAPI[]>;

    /**
     * Gets the set of all currently registered users.
     */
    getRegisteredVoters(): Promise<string[]>;

    /**
     * Registers a new voter.
     */
    addRegisteredVoter(username: string): Promise<{}>;

    /**
     * Unregisters an existing voter.
     */
    removeRegisteredVoter(username: string): Promise<{}>;
}

/**
 * An API client for admin-only actions.
 */
export interface AdminAPIClient {
    /**
     * Scrapes a draft vote from a Reddit CFC post.
     * @param url A URL to a Reddit CFC post.
     * @param discernCandidates Tells if the scraper should try to discern individual candidates.
     */
    scrapeCfc(url: string, discernCandidates: boolean): Promise<Vote>;

    /**
     * Creates a vote by sending in a vote proposal. The server
     * may modify this proposal how it sees fit (by changing, e.g.,
     * IDs), creates the vote, and then returns the vote to the client.
     *
     * @param proposal A vote proposal. This is what the vote should
     * look like visually.
     */
    createVote(proposal: Vote): Promise<Vote>;

    /**
     * Cancels a vote.
     * @param voteId The unique ID of the vote to cancel.
     */
    cancelVote(voteId: string): Promise<boolean>;

    /**
     * Has a candidate resign from a position.
     * @param voteId The vote from which the candidate will resign.
     * @param optionId The candidate that will resign, as an option ID.
     */
    resign(voteId: string, optionId: string): Promise<Vote | { error: string }>;
}
