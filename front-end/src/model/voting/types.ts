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
    tally: "first-past-the-post" | "sainte-lague" | "simdem-sainte-lague";

    /**
     * The number of available seats.
     */
    positions?: number;
};

/// A type of vote where voters rank their options in descending order of preference.
export type RankedChoiceBallotType = {
    /**
     * The tallying option.
     */
    tally: "stv";

    /**
     * The number of available seats.
     */
    positions: number;
};

/// A type of vote where every voter gets to rate every option.
export type RateOptionsBallotType = {
    tally: "spsv" | "star";

    /**
     * The number of available seats.
     */
    positions: number;
    min: number;
    max: number;
};

/**
 * Enumerates vote tallying algorithms.
 */
export type TallyingAlgorithm =
    "first-past-the-post" | "sainte-lague" | "simdem-sainte-lague"
    | "stv"
    | "spsv" | "star";

export type BallotType = ChooseOneBallotType | RateOptionsBallotType | RankedChoiceBallotType;

export type BallotKind = "choose-one" | "rate-options" | "ranked-choice";

export function getBallotKind(ballotType: BallotType): BallotKind {
    switch (ballotType.tally) {
        case "first-past-the-post":
        case "sainte-lague":
        case "simdem-sainte-lague":
            return "choose-one";
        case "stv":
            return "ranked-choice";
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

/// A ballot for a vote where a user gets to rank options.
export type RankedChoiceBallot = {
    id?: string;
    timestamp?: number;

    /**
     * An ordered list of option IDs that represent the voter's preference for candidates,
     * in descending order.
     */
    optionRanking: string[];

    /// Weight if using STV with Gregory method
    weight?: number;
};

/// A ballot for a vote where a user gets to rate options.
export type RateOptionsBallot = {
    id?: string;
    timestamp?: number;
    ratingPerOption: { optionId: string, rating: number }[];
};

/// A ballot.
export type Ballot = ChooseOneBallot | RateOptionsBallot | RankedChoiceBallot;

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
 * A description of a device that may cast a ballot.
 */
 export type DeviceDescription = {
    visitorId: string;
    confidence: {
        score: number
    }
};

export type SessionDescription = {
    id: string;
    user: string;
    expiry: number;
    info: {
        deviceId: string;
        persistentId: string;
        description: DeviceDescription
    }
};

export type SuspiciousBallot = {
    firstBallot: FinishedBallot;
    secondBallot: FinishedBallot;
    firstDevice: SessionDescription;
    secondDevice: SessionDescription;
};

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
        case "ranked-choice":
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
        case "ranked-choice":
        {
            let ranking = (ballot as RankedChoiceBallot).optionRanking;
            let optionIds = vote.options.map(x => x.id);
            return ranking.every(x => optionIds.includes(x));
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
        case "ranked-choice":
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
        case "ranked-choice":
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

export function electsIndividuals(algo: TallyingAlgorithm): boolean {
    switch (algo) {
        case "sainte-lague":
        case "simdem-sainte-lague":
            return false;

        case "first-past-the-post":
        case "spsv":
        case "star":
        case "stv":
            return true;
    }
}

/**
 * A vote outcome that is suitable for describing the results of an election in which either parties
 * or individuals participate. Each option's number of won seats is represented by a pair in an array.
 */
export type VoteOutcome = { optionId: string, seats: number }[];

/**
 * A type of vote outcome that is suitable for describing the results of an election in which individuals
 * are elected directly. Each elected individual is represented as an option ID in an array.
 */
export type IndividualVoteOutcome = string[];

/**
 * Gets the number of seats assigned to a candidate under a vote outcome.
 * @param outcome A vote outcome.
 * @param candidateId A candidate that ran in the election.
 * @returns The number of seats assigned to `candidateId` by `outcome`.
 */
export function numberOfSeats(outcome: VoteOutcome, candidateId: string): number {
    return outcome.find(({ optionId }) => optionId === candidateId)?.seats || 0;
}

/**
 * Gets the total number of seats under a vote outcome.
 * @param outcome A vote outcome.
 * @returns The total number of seats assigned to candidates in `outcome`.
 */
export function totalNumberOfSeats(outcome: VoteOutcome): number {
    return outcome.map(({ seats }) => seats).reduce((acc, value) => acc + value, 0);
}

/**
 * Tests if a candidate obtained a majority of the seats in a vote outcome.
 * @param outcome A vote outcome.
 * @param candidateId A candidate that ran in the election.
 * @returns `true` if `candidateId` has a majority of the seats in `outcome`.
 */
export function hasMajority(outcome: VoteOutcome, candidateId: string): boolean {
    return numberOfSeats(outcome, candidateId) > totalNumberOfSeats(outcome) / 2;
}

/**
 * Visualizes a tally.
 * @param voteAndBallots A vote and its associated ballots.
 * @param seats The number of seats.
 * @returns A list of UI elements, each of which represent a "round" during the tallying.
 */
export type TallyVisualizer = (voteAndBallots: VoteAndBallots, seats?: number) => JSX.Element[];
