import { Typography } from "@material-ui/core";
import React, { PureComponent, ReactNode } from "react";
import { sortBy } from "../../model/util";
import { RateOptionsBallot, RateOptionsBallotType, Vote } from "../../model/vote";
import BallotDots from "./ballot-dots";
import DoneOutlineIcon from '@material-ui/icons/DoneOutline';

type Props = {
    /**
     * The ballot to summarize.
     */
    ballot: RateOptionsBallot;

    /**
     * The vote to which the ballot belongs.
     */
    vote: Vote;

    /**
     * An optional description that gets sandwiched between the
     * ballot ID and the elected candidates.
     */
    description?: ReactNode;

    /**
     * The IDs of all elected candidates on this ballot.
     */
    electedCandidates?: string[];
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
        if (option.ticket) {
            let mainCandidate = option.ticket[0];
            if (mainCandidate.affiliation) {
                return `${mainCandidate.name} (${mainCandidate.affiliation})`;
            } else {
                return mainCandidate.name;
            }
        } else {
            return option.name;
        }
    }

    renderRating(optionId: string, rating: number, isWinner: boolean) {
        return <div>
            {isWinner && <DoneOutlineIcon fontSize="inherit" />} {this.renderCandidate(optionId)} - {generateDotsFromRating(rating)}
        </div>;
    }

    render() {
        let voteType = this.props.vote.type as RateOptionsBallotType;

        // Remove all 0/N ratings.
        let ratings = this.props.ballot.ratingPerOption
            .filter(({ rating }) => rating > voteType.min);

        // Sort ratings.
        ratings = sortBy(ratings, ({ optionId, rating }) => `${rating}-${optionId}`, true);

        let electedIds = this.props.electedCandidates || [];

        let elected = ratings.filter(x => electedIds.includes(x.optionId));
        let unelected = ratings.filter(x => !electedIds.includes(x.optionId));

        return <div>
            <Typography>{this.props.ballot.id}</Typography>
            <hr/>
            {this.props.description && <React.Fragment>
                {this.props.description}
                <hr/>
            </React.Fragment>}
            {elected.map(({ optionId, rating }) => this.renderRating(optionId, rating, true))}
            {unelected.map(({ optionId, rating }) => this.renderRating(optionId, rating, false))}
        </div>;
    }
}

export default RateOptionsBallotSummary;
