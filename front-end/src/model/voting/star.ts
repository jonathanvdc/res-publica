import { MersenneTwister, sortAndShuffle } from "../mersenne-twister";
import { RateOptionsBallot, RateOptionsBallotType, Vote, VoteAndBallots } from "./types";

/**
 * Computes the total score for each candidate from a set of ballots.
 * @param ballots The ballots to count.
 */
function computeTotalScores(ballots: RateOptionsBallot[]): Map<string, number> {
    let results = new Map<string, number>();
    for (let ballot of ballots) {
        for (let { optionId, rating } of ballot.ratingPerOption) {
            results.set(
                optionId,
                rating + (results.get(optionId) || 0));
        }
    }
    return results;
}

function hashString(data: string) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash |= 0;
    }
    return hash;
}

function createRng(vote: Vote): MersenneTwister {
    return new MersenneTwister(hashString(vote.id));
}

function firstRoundSTAR(ballots: RateOptionsBallot[], candidates: string[], rng: MersenneTwister): [string, string] {
    // Compute each candidate's total score.
    let scores = computeTotalScores(ballots);

    // Sort candidates by their scores.
    candidates = sortAndShuffle(candidates,
        (a, b) => {
            let result = (scores.get(b) || 0) - (scores.get(a) || 0);
            return result || compareForRunoffSTAR(ballots, a, b);
        },
        rng);

    return [candidates[0], candidates[1]];
}

function compareForRunoffSTAR(ballots: RateOptionsBallot[], a: string, b: string): number {
    let winsForA = 0;
    let winsForB = 0;
    for (let ballot of ballots) {
        let scoreForA = 0;
        let scoreForB = 0;
        for (let { optionId, rating } of ballot.ratingPerOption) {
            if (optionId === a) {
                scoreForA = rating;
            } else if (optionId === b) {
                scoreForB = rating;
            }
        }
        if (scoreForA > scoreForB) {
            winsForA++;
        } else if (scoreForA < scoreForB) {
            winsForB++;
        }
    }

    if (winsForA === winsForB) {
        let scores = computeTotalScores(ballots);
        return (scores.get(b) || 0) - (scores.get(a) || 0);
    } else {
        return winsForB - winsForA;
    }
}

function runoffRoundSTAR(ballots: RateOptionsBallot[], a: string, b: string, rng: MersenneTwister): string {
    return sortAndShuffle([a, b], (a, b) => compareForRunoffSTAR(ballots, a, b), rng)[0];
}

/**
 * Tallies votes using the STAR (Score Then Automatic Runoff) algorithm.
 * The candidates with the 2 highest scores enter an automatic runoff phase
 * where the candidate who was rated a higher score the most amount of times wins.
 * @param voteAndBallots The vote and the ballots to tally.
 * @param seats The number of seats. If more than one person is to be elected,
 * then we run the STAR algorithm multiple time.
 */
export function tallySTAR(voteAndBallots: VoteAndBallots, seats?: number): string[] {
    // “The President shall be elected using the STAR (Score Then Automatic Runoff)
    //  voting method where voters will give each candidate an integer score between
    //  0 and 5, with 0 being the lowest and 5 being the highest. Blank responses will
    //  be counted as 0s. The candidates with the 2 highest scores enter an automatic
    //  runoff phase where the candidate who was rated a higher score the most amount
    //  of times wins.”
    //
    // “Ties during the first round of calculations shall be broken in favor of the
    //  candidate that beats all other tied candidates pairwise. Ties during the
    //  runoff round of calculations shall be broken in favor of the candidate with
    //  the highest score. If either of these methods fail to successfully break a tie,
    //  that tie will instead be broken pseudorandomly with all tied candidates given
    //  an equal probability of winning.”

    let rng = createRng(voteAndBallots.vote);

    let candidates = voteAndBallots.vote.options;
    let resignations = voteAndBallots.vote.resigned || [];

    let winners: string[] = [];
    let ballotType = voteAndBallots.vote.type as RateOptionsBallotType;
    seats = Math.min(seats || ballotType.positions, candidates.length - resignations.length);
    while (winners.length < seats) {
        let eligible = candidates
            .map(x => x.id)
            .filter(x => !winners.includes(x) && !resignations.includes(x));

        if (eligible.length === 1) {
            winners.push(eligible[0]);
            break;
        }

        let [a, b] = firstRoundSTAR(voteAndBallots.ballots as RateOptionsBallot[], eligible, rng);
        winners.push(runoffRoundSTAR(voteAndBallots.ballots as RateOptionsBallot[], a, b, rng));
    }
    return winners;
}
