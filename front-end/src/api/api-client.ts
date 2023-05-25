import { Authenticator } from "./auth";
import { VoteAndBallots, Ballot, Vote, FinishedBallot, VoteOption } from "../model/vote";
import { NetworkError } from "../model/exceptions";
import { SuspiciousBallot } from "../model/voting/types";

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
    readonly electionManagement: ElectionManagementClient;

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
 * An enumeration of permissions that can be granted to a user.
 */
export enum Permission {
    /**
     * The user can view the list of all votes.
     */
    ViewVotes = "vote.view",
    
    /**
     * The user can cast a ballot in a vote.
     */
    CastBallot = "vote.cast",

    /**
     * The user can create a new vote.
     */
    CreateVote = "election.create",

    /**
     * The user can edit an existing vote.
     */
    EditVote = "election.edit",

    /**
     * The user can cancel an existing vote.
     */
    CancelVote = "election.cancel",

    /**
     * The user can view ballots marked as suspicious in a vote.
     */
    ViewSuspiciousBallots = "election.view-suspicious-ballots",

    /**
     * The user can view the list of all registered users.
     */
    ViewRegisteredUsers = "usermanagement.view",

    /**
     * The user can add a new registered user manually.
     */
    AddRegisteredUser = "usermanagement.add",

    /**
     * The user can remove an existing registered user manually.
     */
    RemoveRegisteredUser = "usermanagement.remove",

    /**
     * The user can edit the permissions of other users.
     * TODO: This permission and functionality are not implemented yet, in both client and server.
     */
    EditPermissions = "administration.edit-permissions",

    /**
     * The user can restart and upgrade the server.
     */
    UpgradeServer = "administration.upgrade-server"
}

/**
 * An API client for optional APIs.
 */
export interface OptionalAPIClient {
    /**
     * Gets a list of all permissions of this user.
     */
    getPermissions(): Promise<string[]>;

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

    /**
     * Upgrades and restarts the server.
     */
    upgradeServer(): Promise<{}>;
}

/**
 * An API client for election management.
 */
export interface ElectionManagementClient {
    /**
     * Scrapes a draft vote from a Reddit CFC post.
     * @param url A URL to a Reddit CFC post.
     * @param discernCandidates Tells if the scraper should try to discern individual candidates.
     */
    scrapeCfc(url: string, discernCandidates: boolean): Promise<Vote>;

    /**
     * Gets the list of all suspicious ballots detected in a given election.
     * @param voteId The unique ID of the vote to check for suspicious ballots.
     */
    getSuspiciousBallots(voteId: string): Promise<SuspiciousBallot[]>;

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

    /**
     * Adds an option to a vote.
     * @param voteId The vote to update.
     * @param option The option to add to the vote's ballots.
     */
    addVoteOption(voteId: string, option: VoteOption): Promise<Vote | { error: string }>;

    /**
     * Edits an existing vote.
     * @param vote The edited vote, which must have the same ID as the vote to edit.
     */
    editVote(vote: Vote): Promise<Vote | { error: string }>;
}

async function requestJSON(method: string, url: string, data: any) {
    let response = await fetch(url, {
        method,
        body: JSON.stringify(data),
        headers: {'Content-Type': 'application/json; charset=UTF-8'}
    });
    if (response.ok) {
        return await response.json();
    } else {
        throw new NetworkError(response);
    }
}

export function postJSON(url: string, data: any) {
    return requestJSON('POST', url, data);
}
