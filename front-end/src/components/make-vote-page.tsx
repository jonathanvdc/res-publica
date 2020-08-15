import React, { Component } from "react";
import { Vote } from "../model/vote";
import VoteCard from "./vote-card";

type Props = {};

type State = {
    vote: Vote;
};

/**
 * A page that allows an admin to create a vote.
 */
class MakeVotePage extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            vote: {
                id: 'new-vote',
                name: 'New Vote',
                description: 'A vote on something.',
                deadline: Date.now() / 1000 + 60 * 60 * 24,
                options: [],
                type: {
                    kind: 'choose-one'
                }
            }
        };
    }

    render() {
        return <VoteCard allowVoteChanges={true} allowBallotChanges={false} voteAndBallots={{ vote: this.state.vote, ballots: [] }} />;
    }
}

export default MakeVotePage;
