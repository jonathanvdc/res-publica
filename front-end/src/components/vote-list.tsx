import React, { PureComponent } from "react";
import { VoteAndBallots } from "../model/vote";
import VoteCard from "./vote-card";

type Props = {
    votes: VoteAndBallots[];
};

/**
 * A list of votes.
 */
class VoteList extends PureComponent<Props> {
    render() {
        let elements: JSX.Element[] = [];
        for (let vote of this.props.votes) {
            elements.push(<VoteCard voteAndBallots={vote} />);
        }

        return <div className="VoteListPanel">
            {elements}
        </div>;
    }
}

export default VoteList;
