import { max } from "../util";
import { countVotes } from "./fptp";
import { tallySainteLague } from "./sainte-lague";
import { ChooseOneBallot, hasMajority, VoteAndBallots, VoteOutcome } from "./types";

function computeSeatCount(ballotsCast: number) {
    if (ballotsCast > 1) {
        return Math.max(3, 2 * Math.round(ballotsCast / (3.5 * Math.log(ballotsCast))) + 1);
    } else {
        return 3;
    }
}

export function tallySimDemSainteLague(voteAndBallots: VoteAndBallots, seats?: number): VoteOutcome {
    seats = seats || voteAndBallots.vote.type.positions || computeSeatCount(voteAndBallots.ballots.length);
    let counts = countVotes(voteAndBallots.ballots as ChooseOneBallot[], voteAndBallots.vote);

    let outcome = tallySainteLague(voteAndBallots, seats);
    const [largestParty, largestPartyVotes] = max([...counts.entries()], ([, votes]) => votes);
    if (largestPartyVotes <= voteAndBallots.ballots.length / 2) {
        return outcome;
    }

    // If a party has a majority in terms of ballots but not in terms of seats, then pad the number of
    // seats until they have a majority.
    while (!hasMajority(outcome, largestParty)) {
        seats++;
        outcome = tallySainteLague(voteAndBallots, seats);
    }

    return outcome;
}
