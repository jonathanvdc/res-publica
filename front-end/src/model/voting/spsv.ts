import { max } from "../util";
import { RateOptionsBallot, RateOptionsBallotType, VoteAndBallots } from "./types";

type KotzePereiraBallot = string[];

/**
 * Applies the Kotze-Pereira transform to a single ballot.
 * @param ballot The ballot to transform.
 * @param type The ballot's type.
 */
function kotzePereira(ballot: RateOptionsBallot, type: RateOptionsBallotType): KotzePereiraBallot[] {
    let virtualBallots: KotzePereiraBallot[] = [];
    for (let i = type.min; i <= type.max; i++) {
        virtualBallots.push(
            ballot.ratingPerOption
                .filter(x => x.rating >= i)
                .map(x => x.optionId));
    }
    return virtualBallots;
}

export function tallySPSV(
    voteAndBallots: VoteAndBallots,
    seats?: number,
    preElected?: string[],
    resigned?: string[]): string[] {

    let ballotType = voteAndBallots.vote.type as RateOptionsBallotType;

    // Apply the Kotze-Pareira transform.
    let virtualBallots = voteAndBallots.ballots.flatMap(ballot =>
        kotzePereira(
            ballot as RateOptionsBallot,
            ballotType));

    // Sort the candidates by ID.
    let sortedCandidates = voteAndBallots.vote.options.map(x => x.id).sort();
    if (resigned) {
        // Remove candidates who have resigned.
        sortedCandidates = sortedCandidates.filter(x => !resigned.includes(x));
    }

    // Then allocate seats.
    let seatCount = seats || Math.min(ballotType.positions, sortedCandidates.length);
    let elected = preElected || [];
    while (elected.length < seatCount) {
        let candidateScores = new Map<string, number>();
        for (let ballot of virtualBallots) {
            let notYetElected = ballot.filter(x => elected.indexOf(x) === -1);
            let alreadyElectedCount = ballot.length - notYetElected.length;
            let weight = 1 / (1 + alreadyElectedCount);
            for (let candidateId of notYetElected) {
                let previousScore = candidateScores.get(candidateId) || 0;
                candidateScores.set(candidateId, previousScore + weight);
            }
        }
        let candidates = sortedCandidates.filter(x => elected.indexOf(x) === -1);
        let bestCandidate = max(candidates, x => candidateScores.get(x) || 0);
        elected.push(bestCandidate);
    }

    return elected;
}
