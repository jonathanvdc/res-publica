import React, { PureComponent } from "react";
import CheckIcon from '@material-ui/icons/Check';
import { Link } from "react-router-dom";
import { VoteAndBallots } from "../model/vote";
import './vote-list.css';
import { Button } from "@material-ui/core";

type Props = {
    votes: VoteAndBallots[];
};

function createVoteLink(voteId: string): string {
    return `/vote/${voteId}`;
}

/**
 * A list of votes.
 */
class VoteList extends PureComponent<Props> {
    render() {
        let elements: JSX.Element[] = [];
        for (let vote of this.props.votes) {
            elements.push(
                <Link className="VoteLink" to={createVoteLink(vote.vote.id)}>
                    <Button className="VoteButton" variant={vote.vote.isActive ? "contained" : "outlined"} color="primary">
                        <div className="VoteButtonText">{vote.vote.name}</div>
                        <div className="CompletedVoteIndicator">{vote.ownBallot ? <CheckIcon /> : []}</div>
                    </Button>
                </Link>);
        }

        return <div className="VoteListPanel">
            {elements}
        </div>;
    }
}

export default VoteList;
