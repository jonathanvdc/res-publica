import { Typography } from "@material-ui/core";
import React, { PureComponent, ReactNode } from "react";
import { sortBy } from "../../model/util";
import { RateOptionsBallot, RateOptionsBallotType, Vote } from "../../model/vote";
import BallotDots from "./ballot-dots";

type Props = {
    /**
     * The ballot to summarize.
     */
    ballot: RateOptionsBallot;

    /**
     * The vote to which the ballot belongs.
     */
    vote: Vote;
};

function generateDotsFromRating(rating: number): ReactNode {
    let weights: number[] = [];
    for (let i = 0; i < rating; i++) {
        weights.push(1);
    }
    return <BallotDots dotWeights={weights} />;
}

/**
 * A summary of a rate-options ballot.
 */
class RateOptionsBallotSummary extends PureComponent<Props> {
    renderCandidate(optionId: string) {
        let option = this.props.vote.options.find(x => x.id === optionId)!;
        return option.name;
    }

    renderRating(optionId: string, rating: number) {
        return <div>
            {this.renderCandidate(optionId)} - {generateDotsFromRating(rating)}
        </div>;
    }

    render() {
        let voteType = this.props.vote.type as RateOptionsBallotType;

        // Remove all 0/N ratings.
        let ratings = this.props.ballot.ratingPerOption
            .filter(({ rating }) => rating > voteType.min);

        // Sort ratings.
        ratings = sortBy(ratings, ({ optionId, rating }) => `${rating}-${optionId}`, true);

        return <div>
            <Typography>{this.props.ballot.id}</Typography>
            {ratings.map(({ optionId, rating }) => this.renderRating(optionId, rating))}
        </div>;
    }
}

export default RateOptionsBallotSummary;
