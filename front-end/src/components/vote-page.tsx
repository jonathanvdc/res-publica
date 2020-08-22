import React, { Component } from "react";
import CheckIcon from '@material-ui/icons/Check';
import { Button, Theme, withStyles, CircularProgress, Paper, Typography, Fab } from "@material-ui/core";
import { green, red } from "@material-ui/core/colors";
import { VoteAndBallots, Ballot, Vote, isActive, isCompletableBallot, completeBallot } from "../model/vote";
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

const DangerButton = withStyles((theme: Theme) => ({
    root: {
        color: theme.palette.getContrastText(red[600]),
        backgroundColor: red[600],
        '&:hover': {
            backgroundColor: red[700],
        },
    },
}))(Button);

const CheckFab = withStyles((theme: Theme) => ({
    root: {
        color: theme.palette.common.white,
        backgroundColor: green[500],
        '&:hover': {
            backgroundColor: green[600],
        }
    },
}))(Fab);

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
        let vote = this.props.voteAndBallots.vote;
        let ballot = completeBallot(this.state.ballot!, vote);
        if (this.props.onCastBallot) {
            this.props.onCastBallot(vote, ballot);
        }
    }

    render() {
        let data: VoteAndBallots = {
            ...this.props.voteAndBallots,
            ownBallot: this.state.ballot
        };
        let allowChanges = !this.props.ballotCast && isActive(this.props.voteAndBallots.vote);
        let canCast = allowChanges && isCompletableBallot(data.ownBallot, data.vote);
        let progressOrButton: JSX.Element;
        if (this.props.ballotCast) {
            progressOrButton = <CircularProgress />;
        } else {
            progressOrButton = <CheckFab disabled={!canCast} aria-label="submit vote" className="SubmitVoteFab" onClick={this.castBallot.bind(this)}>
                <CheckIcon />
            </CheckFab>;
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
                ? <div className="ProgressOrButton">{progressOrButton}</div>
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
