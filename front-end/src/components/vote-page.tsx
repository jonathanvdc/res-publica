import React, { Component } from "react";
import CheckIcon from '@material-ui/icons/Check';
import { Button, Theme, withStyles } from "@material-ui/core";
import { green } from "@material-ui/core/colors";
import { VoteAndBallots, Ballot } from "../model/vote";
import VoteCard from "./vote-card";

type Props = {
    voteAndBallots: VoteAndBallots;
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

    render() {
        let data: VoteAndBallots = {
            ...this.props.voteAndBallots,
            ownBallot: this.state.ballot
        };
        return <div>
            <VoteCard voteAndBallots={data} onBallotChanged={newBallot => this.setState({ ballot: newBallot })} />
            <CheckButton variant="contained" className="SubmitVoteButton">
                <CheckIcon fontSize="large" />
            </CheckButton>
        </div>;
    }
}

export default VotePage;
