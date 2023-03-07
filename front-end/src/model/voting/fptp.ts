import { max } from "../util";
import { ChooseOneBallot, Vote, VoteAndBallots } from "./types";

export function countVotes(ballots: ChooseOneBallot[], vote: Vote): Map<string, number> {
    let counts = new Map<string, number>();
    for (let ballot of ballots) {
        if (vote.resigned
            && vote.resigned.includes(ballot.selectedOptionId)) {
            // Don't count ballots for candidates who have resigned.
            continue;
        }

        let prevScore = counts.get(ballot.selectedOptionId) || 0;
        counts.set(ballot.selectedOptionId, prevScore + 1);
    }
    return counts;
}

export function tallyFPTP(voteAndBallots: VoteAndBallots, seats?: number): string[] {
    seats = seats || voteAndBallots.vote.type.positions || 1;
    let counts = countVotes(voteAndBallots.ballots as ChooseOneBallot[], voteAndBallots.vote);
    let sortedOptions = voteAndBallots.vote.options.map(x => x.id).sort();
    let results: string[] = [];
    while (results.length < seats) {
        let winner = max(sortedOptions, x => counts.get(x) || 0);
        results.push(winner);
        sortedOptions = sortedOptions.filter(x => x !== winner);
    }
    return results;
}
