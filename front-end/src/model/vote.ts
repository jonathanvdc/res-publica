import { MersenneTwister, sortAndShuffle } from "./mersenne-twister";

/**
 * Represents a candidate. Candidates allow for a more fine-grained
 * view of a vote's "name."
 */
export type Candidate = {
    /**
     * The candidate's name.
     */
    name: string;

    /**
     * The candidate's party affiliation, if any.
     */
    affiliation?: string;
};

/// An option in an active or historical vote.
export type VoteOption = {
    /// A unique identifier for the option.
    id: string;

    /// A user-friendly name for the option.
    name: string;

    /**
     * Gets the list of candidates this option consists of.
     * The first candidate is the main candidate, all others
     * are deputies.
     *
     * This is an optional property that allows for a better-looking
     * presentation of candidates in an election than the standard
     * "name" format.
     */
    ticket?: Candidate[];

    /// A markdown description of what this option entails.
    description: string;
};

/// A type of vote where every voter gets to choose exactly one option.
export type ChooseOneBallotType = {
    tally: "first-past-the-post";
};

/// A type of vote where every voter gets to rate every option.
export type RateOptionsBallotType = {
    tally: "spsv" | "star";
    positions: number;
    min: number;
    max: number;
};

export type BallotType = ChooseOneBallotType | RateOptionsBallotType;

export function getBallotKind(ballotType: BallotType): "choose-one" | "rate-options" {
    switch (ballotType.tally) {
        case "first-past-the-post":
            return "choose-one";
        case "spsv":
        case "star":
            return "rate-options";
    }
}

/// An active or historical vote.
export type Vote = {
    /// A unique identifier for the vote.
    id: string;

    /// A user-friendly name for the vote.
    name: string;

    /// A markdown description of what this vote is about.
    description: string;

    /**
     * The point at which the vote started.
     */
    deadline: number;

    /// The vote's type.
    type: BallotType;

    /// A list of all available options in the vote.
    options: VoteOption[];

    /**
     * A list of elected candidates (represented as vote option IDs)
     * that have resigned post-election. After a resignation, ballots
     * must be re-tallied to elect a replacement candidate. Candidates
     * who have been previously elected must of course remain elected.
     *
     * The list of resignations must be ordered in increasing order of
     * resignation time.
     */
    resigned?: string[];
};

/// A ballot for a multiple choice vote.
export type ChooseOneBallot = {
    id?: string;
    timestamp?: number;
    selectedOptionId: string;
};

/// A ballot for a vote where a user gets to rate options.
export type RateOptionsBallot = {
    id?: string;
    timestamp?: number;
    ratingPerOption: { optionId: string, rating: number }[];
};

/// A ballot.
export type Ballot = ChooseOneBallot | RateOptionsBallot;

export type FinishedBallot = Ballot & {
    id: string;
    timestamp: number;
};

/// A vote and all ballots cast for that vote.
export type VoteAndBallots = {
    /// A vote.
    vote: Vote;

    /// All ballots cast so far for `vote`.
    ballots: Ballot[];

    /// A ballot cast by the user, if any.
    ownBallot?: Ballot;
};

/**
 * Tells if a vote is still active.
 */
export function isActive(vote: Vote): boolean {
    return vote.deadline * 1000 > Date.now();
}

/**
 * Finds a list of all vote options that should be on the ballot but aren't.
 * @param ballot A ballot to check.
 * @param vote The vote to which the ballot belongs.
 */
export function findIncompleteOptions(ballot: Ballot | undefined, vote: Vote): VoteOption[] {
    if (!ballot) {
        return vote.options;
    }

    switch (getBallotKind(vote.type)) {
        case "choose-one":
        {
            return [];
        }
        case "rate-options":
        {
            let ratings = (ballot as RateOptionsBallot).ratingPerOption;
            return vote.options.filter(({ id }) => ratings.findIndex(x => x.optionId === id) === -1);
        }
    }
}

/**
 * Checks if a ballot is complete. Only complete ballots can be submitted.
 * @param ballot A ballot to check.
 * @param vote The vote to which the ballot belongs.
 */
export function isCompleteBallot(ballot: Ballot | undefined, vote: Vote): boolean {
    if (!ballot) {
        return false;
    }

    switch (getBallotKind(vote.type)) {
        case "choose-one":
        {
            let optionId = (ballot as ChooseOneBallot).selectedOptionId;
            return vote.options.findIndex(x => x.id === optionId) !== -1;
        }
        case "rate-options":
        {
            let ratings = (ballot as RateOptionsBallot).ratingPerOption;
            for (let { optionId } of ratings) {
                if (vote.options.findIndex(x => x.id === optionId) === -1) {
                    return false;
                }
            }
            for (let { id } of vote.options) {
                if (ratings.findIndex(x => x.optionId === id) === -1) {
                    return false;
                }
            }
            return true;
        }
    }
}

/**
 * Checks if a ballot can be completed automatically.
 * @param ballot A ballot to check.
 * @param vote The vote to which the ballot belongs.
 */
export function isCompletableBallot(ballot: Ballot | undefined, vote: Vote): boolean {
    if (!ballot) {
        return false;
    }

    switch (getBallotKind(vote.type)) {
        case "choose-one":
            return isCompleteBallot(ballot, vote);
        case "rate-options":
            return (ballot as RateOptionsBallot).ratingPerOption.length > 0;
    }
}

/**
 * Completes a partially filled ballot.
 * @param ballot The ballot to complete.
 * @param vote The vote to which the ballot belongs.
 */
export function completeBallot(ballot: Ballot, vote: Vote): Ballot {
    switch (getBallotKind(vote.type)) {
        case "choose-one":
        {
            return ballot;
        }
        case "rate-options":
        {
            let ratings = (ballot as RateOptionsBallot).ratingPerOption;
            let newRatings = [...ratings];
            for (let { id } of vote.options) {
                if (ratings.findIndex(x => x.optionId === id) === -1) {
                    newRatings.push({ optionId: id, rating: (vote.type as RateOptionsBallotType).min });
                }
            }
            return { ...ballot, ratingPerOption: newRatings };
        }
    }
}

function max<TItem, TProp>(seq: TItem[], getProp: (x: TItem) => TProp): TItem {
    let result: TItem = seq[0];
    let maxVal: TProp = getProp(seq[0]);
    for (let item of seq.slice(1)) {
        let val = getProp(item);
        if (val > maxVal) {
            result = item;
            maxVal = val;
        }
    }
    return result;
}

function tallyFPTP(voteAndBallots: VoteAndBallots, seats?: number): string[] {
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
function tallySTAR(voteAndBallots: VoteAndBallots, seats?: number): string[] {
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

    let winners: string[] = [];
    let ballotType = voteAndBallots.vote.type as RateOptionsBallotType;
    seats = Math.min(seats || ballotType.positions, voteAndBallots.vote.options.length);
    while (winners.length < seats) {
        let eligible = voteAndBallots.vote.options.map(x => x.id).filter(x => !winners.includes(x));
        if (eligible.length === 1) {
            winners.push(eligible[0]);
            break;
        }

        let [a, b] = firstRoundSTAR(voteAndBallots.ballots as RateOptionsBallot[], eligible, rng);
        winners.push(runoffRoundSTAR(voteAndBallots.ballots as RateOptionsBallot[], a, b, rng));
    }
    return winners;
}

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

function tallySPSV(
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
