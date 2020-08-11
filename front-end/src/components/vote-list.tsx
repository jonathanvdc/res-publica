import React, { PureComponent } from "react";
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
                    <Button className="VoteButton" variant="contained" color="primary">{vote.vote.name}</Button>
                </Link>);
        }

        return <div className="VoteListPanel">
            {elements}
        </div>;
    }
}

export default VoteList;
