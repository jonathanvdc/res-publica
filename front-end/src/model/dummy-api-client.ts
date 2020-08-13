import { Authenticator } from "./auth";
import { DummyAuthenticator } from "./dummy-auth";
import { APIClient } from "./api-client";
import { Vote, VoteAndBallots, Ballot } from "./vote";

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
        return this.activeVotes;
    }

    async getAllVotes(): Promise<Vote[]> {
        return this.activeVotes.map(data => data.vote);
    }

    async getVote(id: string): Promise<VoteAndBallots | undefined> {
        let vote = this.activeVotes.find(x => x.vote.id === id);
        if (vote) {
            return vote;
        } else {
            return undefined;
        }
    }

    async castBallot(voteId: string, ballot: Ballot): Promise<{ ballotId: string; } | { error: string; }> {
        let vote = await this.getVote(voteId);
        if (!vote) {
            return { error: `vote with ID ${voteId} does not exist.` };
        }

        vote.ownBallot = ballot;
        return { ballotId: voteId + "/ballot" };
    }

    private auth = new DummyAuthenticator();
    private activeVotes = [
        {
            vote: mockVoteAndBallots,
            ballots: []
        },
        {
            vote: mockVoteAndBallots2,
            ballots: []
        }
    ];
}

let mockVoteAndBallots: Vote = {
    id: "mock-vote",
    name: "24th Ballot Initiative",
    description: "We will now vote on **something.**",
    deadline: Date.now() + 1000 * 60 * 60 * 24,
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
    deadline: Date.now() + 1000 * 60 * 60 * 24,
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
