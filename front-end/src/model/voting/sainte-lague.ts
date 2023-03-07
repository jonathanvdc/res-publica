import { max, sortBy } from "../util";
import { countVotes } from "./fptp";
import { ChooseOneBallot, VoteAndBallots, VoteOutcome } from "./types";

export function tallySainteLague(voteAndBallots: VoteAndBallots, seats?: number): VoteOutcome {
    seats = seats || voteAndBallots.vote.type.positions || 1;
    let counts = countVotes(voteAndBallots.ballots as ChooseOneBallot[], voteAndBallots.vote);
    let sortedOptions = voteAndBallots.vote.options.map(x => x.id).sort();

    let won = new Map<string, number>();
    for (let option of sortedOptions) {
        won.set(option, 0);
    }

    for (let i = 0; i < seats; i++) {
        let winner = max(sortedOptions, option => counts.get(option)! / (2 * won.get(option)! + 1));
        won.set(winner, won.get(winner)! + 1);
    }

    let results: VoteOutcome = [];
    for (let [optionId, seats] of won.entries()) {
        results.push({ optionId, seats });
    }
    return sortBy(results, ({ seats }) => seats);
}
