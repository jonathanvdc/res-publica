import { max, removeItem, sortBy } from "../util";
import { RateOptionsBallot, RateOptionsBallotType, VoteAndBallots, VoteOption } from "./types";

/**
 * A Kotze-Pereira ballot in a specific round.
 */
type KotzePereiraBallot = {
    /**
     * The original ballot from which this KP ballot was derived.
     */
    originalBallot: RateOptionsBallot;

    /**
     * The score from which this KP ballot was created.
     */
    score: number;

    /**
     * The candidate IDs of every candidate that this KP ballot
     * approves of. This includes both previously-elected and
     * as of yet unelected candidates.
     */
    approvedCandidates: string[];
};

/**
 * Gets the list of all candidates elected by a KP ballot at the start
 * of a particular round. This does not include that round's winner.
 * @param ballot A KP ballot.
 * @param round An SPSV round.
 */
function getElectedCandidates(ballot: KotzePereiraBallot, round: SPSVRoundInProgress): string[] {
    return round.electedCandidates.filter(x => ballot.approvedCandidates.includes(x));
}

/**
 * Gets the list of all candidates that are approved by a KP ballot
 * but not yet elected at the start of a particular round.
 * @param ballot A KP ballot.
 * @param round An SPSV round.
 */
function getApprovedButUnelectedCandidates(ballot: KotzePereiraBallot, round: SPSVRoundInProgress): string[] {
    return ballot.approvedCandidates.filter(x => !round.electedCandidates.includes(x));
}

/**
 * Gets the weight of a KP ballot in a particular round.
 * @param ballot The ballot to examine.
 */
function getBallotWeight(ballot: KotzePereiraBallot, round: SPSVRoundInProgress): number {
    return 1 / getElectedCandidates(ballot, round).length;
}

/**
 * Describes a candidate during the SPSV process.
 */
export type SPSVCandidate = {
    /**
     * This candidate as a vote option.
     */
    option: VoteOption;

    /**
     * The set of all KP ballots that approve of this candidate.
     */
    approvingBallots: KotzePereiraBallot[];
};

type RoundKind = {
    type: "initial";

    /**
     * A zero-based seat index.
     */
    seatIndex: number;
} | {
    type: "replacement";

    /**
     * The unique ID of the candidate that resigned.
     */
    resignerId: string;
};

/**
 * A description of a round of the SPSV election algorithm.
 */
type SPSVRoundInProgress = {
    /**
     * This round's kind.
     */
    kind: RoundKind;

    /**
     * The set of all KP ballots for this round.
     */
    ballots: KotzePereiraBallot[];

    /**
     * The set of all candidates.
     */
    candidates: SPSVCandidate[];

    /**
     * The set of previously-elected candidates.
     */
    electedCandidates: string[];
};

/**
 * A description of a round of the SPSV election algorithm.
 */
export type SPSVRound = SPSVRoundInProgress & {
    /**
     * This round's winner.
     */
    roundWinner: string;

    /**
     * The set of as of yet unelected candidates.
     */
    unelectedCandidates: string[];
};

/**
 * Gets the list of all candidates elected at the end of an SPSV round.
 * @param round An SPSV round.
 */
function getElectedCandidatesAtEnd(round: SPSVRound): string[] {
    return [...round.electedCandidates, round.roundWinner];
}

/**
 * Applies the Kotze-Pereira transform to a single ballot, assuming
 * no one has been elected yet.
 * @param ballot The ballot to transform.
 * @param type The ballot's type.
 */
function kotzePereira(ballot: RateOptionsBallot, type: RateOptionsBallotType): KotzePereiraBallot[] {
    let virtualBallots: KotzePereiraBallot[] = [];
    for (let i = type.min; i <= type.max; i++) {
        virtualBallots.push({
            originalBallot: ballot,
            score: i,
            approvedCandidates: ballot.ratingPerOption
                .filter(x => x.rating >= i)
                .map(x => x.optionId)
        });
    }
    return virtualBallots;
}

function tallySPSVWithRoundsNoResignations(
    voteAndBallots: VoteAndBallots,
    seats?: number,
    preElected?: string[],
    resigned?: string[],
    createKind?: (seatIndex: number) => RoundKind): SPSVRound[] {

    if (!createKind) {
        createKind = i => ({
            type: "initial",
            seatIndex: i
        });
    }

    let ballotType = voteAndBallots.vote.type as RateOptionsBallotType;
    seats = Math.min(seats || ballotType.positions, voteAndBallots.vote.options.length);

    // Compute the KP ballots.
    let virtualBallots = voteAndBallots.ballots.flatMap(x => kotzePereira(x as RateOptionsBallot, ballotType));

    // Sort the candidates by ID.
    let sortedCandidates = voteAndBallots.vote.options.map(x => x.id).sort();
    if (resigned) {
        // Remove candidates who have resigned.
        sortedCandidates = sortedCandidates.filter(x => !resigned.includes(x));
    }

    let spsvCandidates = voteAndBallots.vote.options.map(option => ({
        option,
        approvingBallots: virtualBallots.filter(y =>
            y.approvedCandidates.includes(option.id))
    }));

    // Then allocate seats.
    let seatCount = seats || Math.min(ballotType.positions, sortedCandidates.length);
    let rounds: SPSVRound[] = [];
    let elected = preElected || [];
    while (elected.length < seatCount) {
        // Build a round in progress.
        let latestRound: SPSVRoundInProgress = {
            kind: createKind(elected.length),
            ballots: virtualBallots,
            candidates: spsvCandidates,
            electedCandidates: [...elected]
        };

        // Figure out which candidate gets the highest score during that round.
        let candidateScores = new Map<string, number>();
        for (let ballot of virtualBallots) {
            let notYetElected = getApprovedButUnelectedCandidates(ballot, latestRound);
            let weight = getBallotWeight(ballot, latestRound);
            for (let candidateId of notYetElected) {
                let previousScore = candidateScores.get(candidateId) || 0;
                candidateScores.set(candidateId, previousScore + weight);
            }
        }
        let unelectedCandidates = sortedCandidates.filter(x => !elected.includes(x));
        let bestCandidate = max(unelectedCandidates, x => candidateScores.get(x) || 0);
        removeItem(unelectedCandidates, bestCandidate);

        // Add the latest round to the list of rounds.
        elected.push(bestCandidate);
        rounds.push({
            ...latestRound,
            roundWinner: bestCandidate,
            unelectedCandidates: sortBy(unelectedCandidates, x => candidateScores.get(x) || 0, true)
        });
    }

    return rounds;
}

export function tallySPSVWithRounds(voteAndBallots: VoteAndBallots, seats?: number): SPSVRound[] {

    // Compute initial set of rounds.
    let rounds = tallySPSVWithRoundsNoResignations(voteAndBallots, seats);
    if (rounds.length === 0) {
        return rounds;
    }

    let resigned = voteAndBallots.vote.resigned || [];
    for (let i = 1; i <= resigned.length; i++) {
        // After every resignation, appoint a replacement by running a single-seat
        // election with ballots that are weighted as those who did not resign
        // were already elected.
        let resignedSlice = resigned.slice(0, i);
        let resignerId = resigned[i - 1];
        let lastRound = rounds[rounds.length - 1];
        let preElected = getElectedCandidatesAtEnd(lastRound).filter(x => !resignedSlice.includes(x))
        rounds.push(
            ...tallySPSVWithRoundsNoResignations(
                voteAndBallots,
                seats,
                preElected,
                resignedSlice,
                () => ({ type: "replacement", resignerId })));
    }
    return rounds;
}

export function tallySPSV(voteAndBallots: VoteAndBallots, seats?: number): string[] {

    let rounds = tallySPSVWithRounds(voteAndBallots, seats);
    if (rounds.length === 0) {
        return [];
    } else {
        return getElectedCandidatesAtEnd(rounds[rounds.length - 1]);
    }
}
