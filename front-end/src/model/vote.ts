import { tallyFPTP } from "./voting/fptp";
import { tallySTAR } from "./voting/star";
import { tallySPSV } from "./voting/spsv";
import { VoteAndBallots, TallyVisualizer } from "./voting/types";
import { visuallyTallySPSV } from "./voting/visualize-spsv";

export type {
    Candidate, VoteOption, ChooseOneBallotType, RateOptionsBallotType,
    BallotType, Vote, ChooseOneBallot, RateOptionsBallot, Ballot,
    FinishedBallot, VoteAndBallots, TallyVisualizer, TallyingAlgorithm
} from "./voting/types";
export {
    getBallotKind, isActive, findIncompleteOptions, isCompleteBallot,
    isCompletableBallot, completeBallot
} from "./voting/types";

/**
 * Gets an appropriate visualizer for ballot tallying, if we have one.
 * @param voteAndBallots A vote and its associated ballots.
 */
export function tryGetTallyVisualizer(voteAndBallots: VoteAndBallots): TallyVisualizer | undefined {
    switch (voteAndBallots.vote.type.tally) {
        case "spsv":
            return visuallyTallySPSV;
        default:
            return undefined;
    }
}

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
            return tallySPSV(voteAndBallots, seats);
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
