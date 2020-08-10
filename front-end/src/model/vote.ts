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
    kind: "choose-one";
};

/// A type of vote where every voter gets to rate every option.
export type RateOptionsBallotType = {
    kind: "rate-options";
    min: number;
    max: number;
};

export type BallotType = ChooseOneBallotType | RateOptionsBallotType;

/// An active or historical vote.
export type Vote = {
    /// A unique identifier for the vote.
    id: string;

    /// A user-friendly name for the vote.
    name: string;

    /// A markdown description of what this vote is about.
    description: string;

    /// Tells if the vote is active. Active votes may be voted on,
    /// inactive votes are historical.
    isActive: boolean;

    /// The vote's type.
    type: BallotType;

    /// A list of all available options in the vote.
    options: VoteOption[];
};

/// A ballot for a multiple choice vote.
export type ChooseOneBallot = {
    selectedOption: string;
};

/// A ballot for a vote where a user gets to rate options.
export type RateOptionsBallot = {
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
