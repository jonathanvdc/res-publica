import React, { Component } from "react";
import CheckIcon from '@material-ui/icons/Check';
import { Button, Theme, withStyles, CircularProgress, Paper, Typography } from "@material-ui/core";
import { green, red } from "@material-ui/core/colors";
import { VoteAndBallots, Ballot, isCompleteBallot, Vote, isActive } from "../model/vote";
import VoteCard from "./vote-card";
import "./vote-page.css";
import { Link } from "react-router-dom";

type Props = {
    voteAndBallots: VoteAndBallots;
    ballotCast?: boolean;
    onCastBallot?: (vote: Vote, ballot: Ballot) => void;
    isAdmin?: boolean;
    onCancelVote?: () => void;
};

type State = {
    ballot: Ballot | undefined;
};

const CheckButton = withStyles((theme: Theme) => ({
    root: {
        borderRadius: "100%",
        padding: "1em",
        color: theme.palette.getContrastText(green[600]),
        backgroundColor: green[600],
        '&:hover': {
            backgroundColor: green[700],
        },
    },
}))(Button);

const DangerButton = withStyles((theme: Theme) => ({
    root: {
        color: theme.palette.getContrastText(red[600]),
        backgroundColor: red[600],
        '&:hover': {
            backgroundColor: red[700],
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
        let allowChanges = !this.props.ballotCast && isActive(this.props.voteAndBallots.vote);
        let canCast = allowChanges && isCompleteBallot(data.ownBallot, data.vote);
        let buttonOrProgress: JSX.Element;
        if (this.props.ballotCast) {
            buttonOrProgress = <CircularProgress />;
        } else {
            buttonOrProgress = <CheckButton disabled={!canCast} variant="contained" className="SubmitVoteButton" onClick={this.castBallot.bind(this)} >
                <CheckIcon fontSize="large" />
            </CheckButton>;
        }
        return <div className="VotePagePanel">
            <VoteCard
                voteAndBallots={data}
                allowBallotChanges={allowChanges}
                onBallotChanged={newBallot => {
                    if (isActive(data.vote)) {
                        this.setState({ ...this.state, ballot: newBallot });
                    } else {
                        this.setState({ ...this.state });
                    }
                }} />
            {isActive(data.vote)
                ? <div className="ButtonOrProgressPanel">{buttonOrProgress}</div>
                : <Link to={`/vote/${data.vote.id}/ballots`}><Button style={{ marginBottom: "1em" }} variant="contained">View Ballots</Button></Link>}
            {isActive(data.vote) && this.props.isAdmin && this.props.onCancelVote &&
                <Paper className="VoteDangerZone" style={{ marginTop: "5em", padding: "1em 0" }}>
                    <Typography variant="h5" style={{ marginBottom: "1em" }}>Danger Zone</Typography>
                    <DangerButton
                        variant="contained"
                        onClick={() => { if (this.props.onCancelVote) { this.props.onCancelVote(); } }}>

                        Cancel Vote
                </DangerButton>
                </Paper>}
        </div>;
    }
}

export default VotePage;
