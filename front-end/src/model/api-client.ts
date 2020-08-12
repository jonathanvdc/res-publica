import { Authenticator } from "./auth";
import { VoteAndBallots, Ballot, Vote } from "./vote";

/**
 * A client that allows the application to interact with the server's API.
 */
export interface APIClient {
    /**
     * Gets an authenticator appropriate for this API client.
     */
    readonly authenticator: Authenticator;

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
    castBallot(voteId: string, ballot: Ballot): Promise<{ ballotId: string } | { error: string }>;
}
