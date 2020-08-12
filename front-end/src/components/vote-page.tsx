import React, { Component } from "react";
import CheckIcon from '@material-ui/icons/Check';
import { Button, Theme, withStyles } from "@material-ui/core";
import { green } from "@material-ui/core/colors";
import { VoteAndBallots, Ballot, isCompleteBallot, Vote } from "../model/vote";
import VoteCard from "./vote-card";

type Props = {
    voteAndBallots: VoteAndBallots;
    onCastBallot?: (vote: Vote, ballot: Ballot) => void;
};

type State = {
    ballot: Ballot | undefined;
};

const CheckButton = withStyles((theme: Theme) => ({
    root: {
        marginTop: "3em",
        borderRadius: "100%",
        padding: "1em",
        color: theme.palette.getContrastText(green[600]),
        backgroundColor: green[600],
        '&:hover': {
            backgroundColor: green[700],
        },
    },
}))(Button);

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

    castBallot() {
        let ballot = this.state.ballot!;
        if (this.props.onCastBallot) {
            this.props.onCastBallot(this.props.voteAndBallots.vote, ballot);
        }
    }

    render() {
        let data: VoteAndBallots = {
            ...this.props.voteAndBallots,
            ownBallot: this.state.ballot
        };
        let ballotReady = isCompleteBallot(data.ownBallot, data.vote);
        return <div>
            <VoteCard voteAndBallots={data} onBallotChanged={newBallot => this.setState({ ballot: newBallot })} />
            <CheckButton disabled={!ballotReady} variant="contained" className="SubmitVoteButton" onClick={this.castBallot.bind(this)} >
                <CheckIcon fontSize="large" />
            </CheckButton>
        </div>;
    }
}

export default VotePage;
