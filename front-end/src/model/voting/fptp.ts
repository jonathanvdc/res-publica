import { max } from "../util";
import { ChooseOneBallot, VoteAndBallots } from "./types";

export function tallyFPTP(voteAndBallots: VoteAndBallots, seats?: number): string[] {
    seats = seats || 1;
    let counts = new Map<string, number>();
    for (let ballot of voteAndBallots.ballots) {
        let fptpBallot = ballot as ChooseOneBallot;
        if (voteAndBallots.vote.resigned
            && voteAndBallots.vote.resigned.includes(fptpBallot.selectedOptionId)) {
            // Don't count ballots for candidates who have resigned.
            continue;
        }

        let prevScore = counts.get(fptpBallot.selectedOptionId) || 0;
        counts.set(fptpBallot.selectedOptionId, prevScore + 1);
    }
    let sortedOptions = voteAndBallots.vote.options.map(x => x.id).sort();
    let results: string[] = [];
    while (results.length < seats) {
        let winner = max(sortedOptions, x => counts.get(x) || 0);
        results.push(winner);
        sortedOptions = sortedOptions.filter(x => x !== winner);
    }
    return results;
}
