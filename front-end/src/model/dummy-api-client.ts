import { Authenticator } from "./auth";
import { DummyAuthenticator } from "./dummy-auth";
import { APIClient } from "./api-client";
import { Vote, VoteAndBallots } from "./vote";

/**
 * An API client that fakes all interactions with the server.
 */
export class DummyAPIClient implements APIClient {
    /**
     * Gets an authenticator appropriate for this API client.
     */
    get authenticator(): Authenticator {
        return this.auth;
    }

    async getActiveVotes(): Promise<VoteAndBallots[]> {
        return activeVotes.map(vote => ({ vote, ballots: [] }));
    }

    async getVote(id: string): Promise<VoteAndBallots | undefined> {
        let vote = activeVotes.find(x => x.id === id);
        if (vote) {
            return {
                vote,
                ballots: []
            };
        } else {
            return undefined;
        }
    }

    private auth = new DummyAuthenticator();
}

let mockVoteAndBallots: Vote = {
    id: "mock-vote",
    name: "24th Ballot Initiative",
    description: "We will now vote on **something.**",
    isActive: true,
    type: { kind: "choose-one" },
    options: [
        {
            id: "option-1",
            name: "Yes",
            description: "Approve the proposed proposal as proposed by someone at some point, probably."
        },
        {
            id: "option-2",
            name: "No",
            description: "Wow such option two"
        }
    ]
};

let mockVoteAndBallots2: Vote = {
    id: "mock-vote-2",
    name: "44th Presidential Election",
    description: "We will now vote on **something.**",
    isActive: true,
    type: { kind: "rate-options", min: 1, max: 5 },
    options: [
        {
            id: "option-1",
            name: "Ronald McDonald",
            description: "Free burgers for everyone."
        },
        {
            id: "option-2",
            name: "Scrooge McDuck",
            description: "Elect me and I'll make you rich!"
        }
    ]
};

let activeVotes = [mockVoteAndBallots, mockVoteAndBallots2];
