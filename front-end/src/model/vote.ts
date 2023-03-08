import { tallyFPTP } from "./voting/fptp";
import { tallySTAR } from "./voting/star";
import { tallySPSV } from "./voting/spsv";
import { tallySTV } from "./voting/stv";
import { VoteAndBallots, TallyVisualizer, VoteOutcome, IndividualVoteOutcome, electsIndividuals } from "./voting/types";
import { visuallyTallySPSV } from "./voting/visualize-spsv";
import { tallySainteLague } from "./voting/sainte-lague";
import { sortBy } from "./util";
import { tallySimDemSainteLague } from "./voting/simdem-sainte-lague";

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

export function individualToParty(outcome: IndividualVoteOutcome): VoteOutcome {
    return outcome.map(optionId => ({ optionId, seats: 1 }));
}

export function partyToIndividual(outcome: VoteOutcome): IndividualVoteOutcome {
    let results: IndividualVoteOutcome = [];
    for (let { optionId, seats } of outcome) {
        for (let i = 0; i < seats; i++) {
            results.push(optionId);
        }
    }
    return results;
}

export function tallyIndividual(voteAndBallots: VoteAndBallots, seats?: number): IndividualVoteOutcome {
    return partyToIndividual(tally(voteAndBallots, seats));
}

export function tally(voteAndBallots: VoteAndBallots, seats?: number): VoteOutcome {
    switch (voteAndBallots.vote.type.tally) {
        case "first-past-the-post":
            return individualToParty(tallyFPTP(voteAndBallots, seats));
        case "sainte-lague":
            return tallySainteLague(voteAndBallots, seats);
        case "simdem-sainte-lague":
            return tallySimDemSainteLague(voteAndBallots, seats);
        case "stv":
            return individualToParty(tallySTV(voteAndBallots, seats));
        case "star":
            return individualToParty(tallySTAR(voteAndBallots, seats));
        case "spsv":
            return individualToParty(tallySPSV(voteAndBallots, seats));
    }
}

/**
 * Orders a vote's options based on how well they did during a hypothetical
 * election where the number of seats is equal to the number of candidates
 * and no one resigns.
 * @param voteAndBallots A vote and its ballots.
 */
export function tallyOrder(voteAndBallots: VoteAndBallots): IndividualVoteOutcome {
    if (electsIndividuals(voteAndBallots.vote.type.tally)) {
        return Array.from(new Set(tallyIndividual(
            { ...voteAndBallots, vote: { ...voteAndBallots.vote, resigned: [] } },
            voteAndBallots.vote.options.length)));
    } else {
        return sortBy(tally(voteAndBallots), ({ seats }) => seats, true).map(({ optionId }) => optionId);
    }
}
