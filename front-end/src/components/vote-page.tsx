import React, { Component } from "react";
import CheckIcon from '@material-ui/icons/Check';
import { Button, Theme, withStyles, CircularProgress, Paper, Typography, Fab, DialogTitle, Dialog, DialogContent, DialogContentText, DialogActions } from "@material-ui/core";
import { green, red } from "@material-ui/core/colors";
import { Link } from "react-router-dom";
import { VoteAndBallots, Ballot, Vote, isActive, isCompletableBallot, completeBallot, isCompleteBallot, findIncompleteOptions, tally } from "../model/vote";
import VoteCard from "./vote-card";
import DropDownButton from "./drop-down-button";
import "./vote-page.css";

type Props = {
    voteAndBallots: VoteAndBallots;
    ballotCast?: boolean;
    onCastBallot?: (vote: Vote, ballot: Ballot) => void;
    isAdmin?: boolean;
    onCancelVote?: () => void;

    /**
     * A callback for when a winner resigns from their seat.
     */
    onResign?: (optionId: string) => void;
};

type State = {
    ballot: Ballot | undefined;
    confirmingPartialBallot: boolean;
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
            ballot: this.props.voteAndBallots.ownBallot,
            confirmingPartialBallot: false
        };
    }

    castBallot() {
        let vote = this.props.voteAndBallots.vote;
        if (isCompleteBallot(this.state.ballot!, vote)) {
            this.forceCastBallot();
        } else {
            this.setState({
                ...this.state,
                confirmingPartialBallot: true
            });
        }
    }

    onCancelPartialBallot() {
        this.setState({
            ...this.state,
            confirmingPartialBallot: false
        });
    }

    forceCastBallot() {
        let vote = this.props.voteAndBallots.vote;
        let ballot = completeBallot(this.state.ballot!, vote);
        if (this.props.onCastBallot) {
            this.props.onCastBallot(vote, ballot);
        }
    }

    renderPartialBallotDialog(data: VoteAndBallots) {
        let incomplete = findIncompleteOptions(this.state.ballot, data.vote).map(x => x.name);
        if (incomplete.length > 3) {
            incomplete = incomplete.slice(0, 3);
            incomplete.push("others");
        }
        let incompleteText = incomplete.length === 1
            ? incomplete[0]
            : `${incomplete.slice(0, incomplete.length - 1).join(", ")} and ${incomplete[incomplete.length - 1]}`;

        return <Dialog
            open={this.state.confirmingPartialBallot}
            onClose={this.onCancelPartialBallot.bind(this)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description">
            <DialogTitle id="alert-dialog-title">Cast partial ballot?</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    Your ballot incomplete. You have not yet expressed a preference for {incompleteText}.
                    If you do not express preferences for them manually, your ballot will be autofilled
                    with the minimum preference for those options. Are you sure you want to proceed?
            </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={this.onCancelPartialBallot.bind(this)} color="primary">No</Button>
                <Button onClick={this.forceCastBallot.bind(this)} color="primary" autoFocus>Yes</Button>
            </DialogActions>
        </Dialog>;
    }

    renderAdminZone(data: VoteAndBallots): JSX.Element | undefined {
        let onCancelVote = this.props.onCancelVote;
        let canCancelVote = isActive(data.vote) && this.props.onCancelVote;
        let onResign = this.props.onResign;
        let canResign = !isActive(data.vote) && onResign &&
            data.vote.options.length - (data.vote.resigned?.length || 0) > 0;

        if (!canCancelVote && !canResign) {
            return undefined;
        }

        let winners = canResign ? tally(data) : [];

        return <Paper className="VoteDangerZone" style={{ marginTop: "5em", padding: "1em 0" }}>
            <Typography variant="h5" style={{ marginBottom: "1em" }}>Danger Zone</Typography>
            {canResign &&
                <DropDownButton
                    button={props => <DangerButton {...props} variant="contained">Mark Resignation</DangerButton>}
                    options={data.vote.options.filter(x => winners.includes(x.id))}
                    onSelectOption={optionId => onResign!(optionId)} />}
            {canCancelVote &&
                <DangerButton
                    variant="contained"
                    onClick={() => { onCancelVote!(); }}>

                    Cancel Vote
                </DangerButton>}
        </Paper>;
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
            {this.props.isAdmin && this.renderAdminZone(data)}
            {isActive(data.vote) && this.renderPartialBallotDialog(data)}
        </div>;
    }
}

export default VotePage;
