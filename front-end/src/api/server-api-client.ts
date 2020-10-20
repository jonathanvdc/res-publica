import { Authenticator } from "./auth";
import { VoteAndBallots, Ballot, Vote, FinishedBallot } from "../model/vote";
import { APIClient, AdminAPIClient, OptionalAPIClient, OptionalAPI } from "./api-client";
import { RedditAuthenticator } from "./reddit-auth";

/**
 * A client implementation that communicates with the server's API.
 */
export class ServerAPIClient implements APIClient {
    constructor() {
        this.auth = new RedditAuthenticator();
        this.admin = new ServerAdminAPIClient(this.auth);
        this.optional = new ServerOptionalAPIClient(this.auth);
    }

    /**
     * Gets an authenticator appropriate for this API client.
     */
    get authenticator(): Authenticator {
        return this.auth;
    }

    readonly admin: ServerAdminAPIClient;
    readonly optional: ServerOptionalAPIClient;

    /**
     * Gets all currently active votes.
     */
    async getActiveVotes(): Promise<VoteAndBallots[]> {
        let response = await fetch(`/api/active-votes?deviceId=${encodeURIComponent(this.auth.deviceId)}`);
        return await response.json();
    }

    /**
     * Gets a list of all votes so far.
     */
    async getAllVotes(): Promise<Vote[]> {
        let response = await fetch("/api/all-votes");
        return await response.json();
    }

    /**
     * Gets a specific vote.
     */
    async getVote(id: string): Promise<VoteAndBallots | undefined> {
        let response = await fetch(`/api/vote?voteId=${encodeURIComponent(id)}&deviceId=${encodeURIComponent(this.auth.deviceId)}`);
        return await response.json();
    }

    /**
     * Casts a ballot for an active vote. If the ballot was
     * submitted successfully, a unique identifier for the ballot
     * is returned that can be used to verify that the ballot was
     * indeed well received.
     */
    castBallot(voteId: string, ballot: Ballot): Promise<FinishedBallot | { error: string }> {
        return postJSON(
            `/api/cast-ballot?voteId=${encodeURIComponent(voteId)}&deviceId=${encodeURIComponent(this.auth.deviceId)}`,
            ballot);
    }

    private auth: RedditAuthenticator;
}

class ServerAdminAPIClient implements AdminAPIClient {
    constructor(private readonly auth: RedditAuthenticator) {

    }

    async cancelVote(voteId: string): Promise<boolean> {
        return postJSON(
            `/api/admin/cancel-vote?voteId=${encodeURIComponent(voteId)}&deviceId=${encodeURIComponent(this.auth.deviceId)}`,
            {});
    }

    async scrapeCfc(url: string, discernCandidates: boolean): Promise<Vote> {
        let response = await fetch(
            `/api/admin/scrape-cfc?url=${encodeURIComponent(url)}` +
            `&deviceId=${encodeURIComponent(this.auth.deviceId)}` +
            `&discernCandidates=${discernCandidates}`);
        return await response.json();
    }

    resign(voteId: string, optionId: string): Promise<Vote | { error: string }> {
        return postJSON(
            `/api/admin/resign?voteId=${encodeURIComponent(voteId)}` +
            `&optionId=${encodeURIComponent(optionId)}` +
            `&deviceId=${encodeURIComponent(this.auth.deviceId)}`,
            {});
    }

    createVote(proposal: Vote): Promise<Vote> {
        return postJSON(
            `/api/admin/create-vote?deviceId=${encodeURIComponent(this.auth.deviceId)}`,
            proposal);
    }
}

class ServerOptionalAPIClient implements OptionalAPIClient {
    constructor(private readonly auth: RedditAuthenticator) {

    }

    async getAvailable(): Promise<OptionalAPI[]> {
        let response = await fetch(
            `/api/optional/available?deviceId=${encodeURIComponent(this.auth.deviceId)}`);
        return await response.json();
    }

    async getRegisteredVoters(): Promise<string[]> {
        let response = await fetch(
            `/api/optional/registered-voters?deviceId=${encodeURIComponent(this.auth.deviceId)}`);
        return await response.json();
    }

    /**
     * Registers a new voter.
     */
    async addRegisteredVoter(username: string): Promise<{}> {
        return postJSON(
            `/api/optional/add-registered-voter?deviceId=${encodeURIComponent(this.auth.deviceId)}` +
            `&userId=${encodeURIComponent(username)}`,
            {});
    }

    /**
     * Unregisters an existing voter.
     */
    async removeRegisteredVoter(username: string): Promise<{}> {
        return postJSON(
            `/api/optional/remove-registered-voter?deviceId=${encodeURIComponent(this.auth.deviceId)}` +
            `&userId=${encodeURIComponent(username)}`,
            {});
    }

    async upgradeServer(): Promise<{}> {
        return postJSON('/api/optional/upgrade-server', {
            'deviceId': this.auth.deviceId
        });
    }
}

async function postJSON(url: string, data: any) {
    let response = await fetch(
        url,
        {
            method: "POST",
            body: JSON.stringify(data),
            headers: {'Content-Type': 'application/json; charset=UTF-8'}
        });
    return await response.json();
}
