/// An option in an active or historical vote.
export type VoteOption = {
    /// A unique identifier for the option.
    id: string;

    /// A user-friendly name for the option.
    name: string;

    /// A markdown description of what this option entails.
    description: string;
};

/// A type of vote where every voter gets to choose exactly one option.
export type ChooseOneBallotType = {
    tally: "first-past-the-post";
};

/// A type of vote where every voter gets to rate every option.
export type RateOptionsBallotType = {
    tally: "spsv";
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
};

/// A ballot for a multiple choice vote.
export type ChooseOneBallot = {
    id?: string;
    selectedOptionId: string;
};

/// A ballot for a vote where a user gets to rate options.
export type RateOptionsBallot = {
    id?: string;
    ratingPerOption: { optionId: string, rating: number }[];
};

/// A ballot.
export type Ballot = ChooseOneBallot | RateOptionsBallot;

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
