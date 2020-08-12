import React, { Component } from "react";
import { VoteAndBallots, Ballot } from "../model/vote";
import './vote-card.css';
import VoteCard from "./vote-card";

type Props = {
    voteAndBallots: VoteAndBallots;
};

type State = {
    ballot: Ballot | undefined;
};

/**
 * A page that allows users to inspect and interact with a vote.
 */
class VotePage extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            ballot: this.props.voteAndBallots.ownBallot
        };
    }

    render() {
        let data: VoteAndBallots = {
            ...this.props.voteAndBallots,
            ownBallot: this.state.ballot
        };
        return <VoteCard voteAndBallots={data} onBallotChanged={newBallot => this.setState({ ballot: newBallot })} />;
    }
}

export default VotePage;
