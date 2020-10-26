export type {
    Candidate, VoteOption, ChooseOneBallotType, RateOptionsBallotType,
    BallotType, Vote, ChooseOneBallot, RateOptionsBallot, Ballot,
    FinishedBallot, VoteAndBallots
} from "./voting/types";
export {
    getBallotKind, isActive, findIncompleteOptions, isCompleteBallot,
    isCompletableBallot, completeBallot
} from "./voting/types";

import { tallyFPTP } from "./voting/fptp";
import { tallySTAR } from "./voting/star";
import { tallySPSV } from "./voting/spsv";
import { VoteAndBallots } from "./voting/types";

export function tally(voteAndBallots: VoteAndBallots, seats?: number): string[] {
    switch (voteAndBallots.vote.type.tally) {
        case "first-past-the-post":
        {
            return tallyFPTP(voteAndBallots, seats);
        }
        case "star":
        {
            return tallySTAR(voteAndBallots, seats);
        }
        case "spsv":
        {
            let result = tallySPSV(voteAndBallots, seats);
            let resigned = voteAndBallots.vote.resigned || [];
            for (let i = 1; i <= resigned.length; i++) {
                // After every ballot, appoint a resignation by running a single-seat
                // election with ballots that are weighted as those who did not resign
                // were already elected.
                let resignedSlice = resigned.slice(0, i);
                result = tallySPSV(
                    voteAndBallots,
                    seats,
                    result.filter(x => !resignedSlice.includes(x)),
                    resignedSlice);
            }
            return result;
        }
    }
}

/**
 * Orders a vote's options based on how well they did during a hypothetical
 * election where the number of seats is equal to the number of candidates
 * and no one resigns.
 * @param voteAndBallots A vote and its ballots.
 */
export function tallyOrder(voteAndBallots: VoteAndBallots): string[] {
    return tally(
        { ...voteAndBallots, vote: { ...voteAndBallots.vote, resigned: [] } },
        voteAndBallots.vote.options.length);
}
