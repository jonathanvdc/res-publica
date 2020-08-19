import { Authenticator, makeid } from "./auth";
import { DummyAuthenticator } from "./dummy-auth";
import { APIClient, AdminAPIClient } from "./api-client";
import { Vote, VoteAndBallots, Ballot } from "./vote";

/**
 * An API client that fakes all interactions with the server.
 */
export class DummyAPIClient implements APIClient {
    constructor() {
        this.activeVotes = [
            {
                vote: mockVoteAndBallots,
                ballots: []
            },
            {
                vote: mockVoteAndBallots2,
                ballots: []
            }
        ];
        this.admin = new DummyAdminAPIClient(this.activeVotes);
    }

    /**
     * Gets an authenticator appropriate for this API client.
     */
    get authenticator(): Authenticator {
        return this.auth;
    }

    readonly admin: DummyAdminAPIClient;

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
    private activeVotes: VoteAndBallots[];
}

class DummyAdminAPIClient implements AdminAPIClient {
    constructor(private activeVotes: VoteAndBallots[]) {
    }

    async createVote(proposal: Vote): Promise<Vote> {
        let voteId = `vote-${makeid(20)}`;
        let newVote = {
            ...proposal,
            id: voteId
        };
        this.activeVotes.push({ vote: newVote, ballots: [] });
        return newVote;
    }

    async scrapeCfc(url: string): Promise<Vote> {
        return mockVoteAndBallots2;
    }
}


let mockVoteAndBallots: Vote = {
    id: "mock-vote",
    name: "24th Ballot Initiative",
    description: "We will now vote on **something.**",
    deadline: (Date.now() + 1000 * 60 * 60 * 24) / 1000,
    type: { tally: "first-past-the-post" },
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
    deadline: (Date.now() + 1000 * 60 * 60 * 24) / 1000,
    type: { tally: "spsv", positions: 1, min: 1, max: 5 },
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
