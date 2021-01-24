import { Authenticator } from "./auth";
import { VoteAndBallots, Ballot, Vote, FinishedBallot, VoteOption } from "../model/vote";
import { APIClient, ElectionManagementClient, OptionalAPIClient, OptionalAPI, postJSON } from "./api-client";
import { RedditAuthenticator } from "./reddit-auth";

/**
 * A client implementation that communicates with the server's API.
 */
export class ServerAPIClient implements APIClient {
    constructor() {
        this.auth = new RedditAuthenticator();
        this.electionManagement = new ServerElectionManagementClient(this.auth);
        this.optional = new ServerOptionalAPIClient(this.auth);
    }

    /**
     * Gets an authenticator appropriate for this API client.
     */
    get authenticator(): Authenticator {
        return this.auth;
    }

    readonly electionManagement: ServerElectionManagementClient;
    readonly optional: ServerOptionalAPIClient;

    /**
     * Gets all currently active votes.
     */
    getActiveVotes(): Promise<VoteAndBallots[]> {
        return postJSON('/api/core/active-votes', {
            deviceId: this.auth.deviceId
        });
    }

    /**
     * Gets a list of all votes so far.
     */
    getAllVotes(): Promise<Vote[]> {
        return postJSON('/api/core/all-votes', {
            deviceId: this.auth.deviceId
        });
    }

    /**
     * Gets a specific vote.
     */
    getVote(id: string): Promise<VoteAndBallots | undefined> {
        return postJSON('/api/core/vote', {
            deviceId: this.auth.deviceId,
            voteId: id
        });
    }

    /**
     * Casts a ballot for an active vote. If the ballot was
     * submitted successfully, a unique identifier for the ballot
     * is returned that can be used to verify that the ballot was
     * indeed well received.
     */
    castBallot(voteId: string, ballot: Ballot): Promise<FinishedBallot | { error: string }> {
        return postJSON('/api/core/cast-ballot', {
            deviceId: this.auth.deviceId,
            voteId,
            ballot
        });
    }

    private auth: RedditAuthenticator;
}

class ServerElectionManagementClient implements ElectionManagementClient {
    constructor(private readonly auth: RedditAuthenticator) {

    }

    cancelVote(voteId: string): Promise<boolean> {
        return postJSON('/api/election-management/cancel-vote', {
            deviceId: this.auth.deviceId,
            voteId
        });
    }

    scrapeCfc(url: string, discernCandidates: boolean): Promise<Vote> {
        return postJSON('/api/election-management/scrape-cfc', {
            deviceId: this.auth.deviceId,
            url,
            discernCandidates
        });
    }

    addVoteOption(voteId: string, option: VoteOption): Promise<Vote | { error: string }> {
        return postJSON('/api/election-management/add-vote-option', {
            deviceId: this.auth.deviceId,
            voteId,
            option
        });
    }

    editVote(vote: Vote): Promise<Vote | { error: string }> {
        return postJSON('/api/election-management/edit-vote', {
            deviceId: this.auth.deviceId,
            vote
        });
    }

    resign(voteId: string, optionId: string): Promise<Vote | { error: string }> {
        return postJSON('/api/election-management/resign', {
            deviceId: this.auth.deviceId,
            voteId,
            optionId
        });
    }

    createVote(proposal: Vote): Promise<Vote> {
        return postJSON('/api/election-management/create-vote', {
            deviceId: this.auth.deviceId,
            proposal
        });
    }
}

class ServerOptionalAPIClient implements OptionalAPIClient {
    constructor(private readonly auth: RedditAuthenticator) {

    }

    getAvailable(): Promise<OptionalAPI[]> {
        return postJSON('/api/optional/available', {
            deviceId: this.auth.deviceId
        });
    }

    getRegisteredVoters(): Promise<string[]> {
        return postJSON('/api/optional/registered-voters', {
            deviceId: this.auth.deviceId
        });
    }

    /**
     * Registers a new voter.
     */
    addRegisteredVoter(username: string): Promise<{}> {
        return postJSON('/api/optional/add-registered-voter', {
            deviceId: this.auth.deviceId,
            userId: username
        });
    }

    /**
     * Unregisters an existing voter.
     */
    removeRegisteredVoter(username: string): Promise<{}> {
        return postJSON('/api/optional/remove-registered-voter', {
            deviceId: this.auth.deviceId,
            userId: username
        });
    }

    upgradeServer(): Promise<{}> {
        return postJSON('/api/optional/upgrade-server', {
            deviceId: this.auth.deviceId
        });
    }
}
