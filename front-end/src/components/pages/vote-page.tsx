import React, { Component } from "react";
import { Button, CircularProgress, Paper, Typography, DialogTitle, Dialog, DialogContent, DialogContentText, DialogActions } from "@material-ui/core";
import { Link } from "react-router-dom";
import { VoteAndBallots, Ballot, Vote, isActive, isCompletableBallot, completeBallot, isCompleteBallot, findIncompleteOptions, tally, tryGetTallyVisualizer } from "../../model/vote";
import VoteCard from "../vote-card";
import DropDownButton from "../drop-down-button";
import "./vote-page.css";
import { DangerButton } from "../danger-button";
import { CheckFab } from "../check-fab";

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

type AdminZoneProps = {
    data: VoteAndBallots;
    onCancelVote?: () => void;
    onResign?: (optionId: string) => void;
};

type AdminZoneState = {
    dialogOpen: true;
    dialogText: JSX.Element;
    confirmAction: () => void;
} | {
    dialogOpen: false;
    dialogText?: JSX.Element;
};

class AdminZone extends Component<AdminZoneProps, AdminZoneState> {
    constructor(props: AdminZoneProps) {
        super(props);
        this.state = { dialogOpen: false };
    }

    confirmThenAct(dialogText: JSX.Element, confirmAction: () => void) {
        this.setState({
            dialogOpen: true,
            dialogText,
            confirmAction
        });
    }

    onCancelAction() {
        this.setState({ dialogOpen: false, dialogText: this.state.dialogText });
    }

    onProceedWithAction() {
        if (this.state.dialogOpen) {
            let callback = this.state.confirmAction;
            this.onCancelAction();
            callback();
        }
    }

    render() {
        let data = this.props.data;
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
                    onSelectOption={optionId =>
                        this.confirmThenAct(
                            <span>
                                You are about to mark <b>{data.vote.options.find(x => x.id === optionId)?.name}</b>'s resignation.
                                This cannot be undone. Proceed?
                            </span>,
                            () => onResign!(optionId))}
                />}
            {canCancelVote &&
                <DangerButton
                    variant="contained"
                    onClick={() => this.confirmThenAct(
                        <span>
                            You are about to cancel <b>{data.vote.name}</b>.
                            This cannot be undone. Proceed?
                        </span>,
                        () => onCancelVote!())}>

                    Cancel Vote
                </DangerButton>}
            <Dialog
                open={this.state.dialogOpen}
                onClose={this.onCancelAction.bind(this)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description">
                <DialogTitle id="alert-dialog-title">Are you sure?</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {this.state.dialogText}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onCancelAction.bind(this)} color="primary">No</Button>
                    <Button onClick={this.onProceedWithAction.bind(this)} color="primary" autoFocus>Yes</Button>
                </DialogActions>
            </Dialog>
        </Paper>;
    }
}

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
                    Your ballot is incomplete. You have not yet expressed a preference for {incompleteText}.
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

    renderAdminZone(data: VoteAndBallots) {
        return <AdminZone data={data} onCancelVote={this.props.onCancelVote} onResign={this.props.onResign} />;
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
            progressOrButton = <CheckFab disabled={!canCast} aria-label="submit vote" className="SubmitVoteFab" onClick={this.castBallot.bind(this)} />;
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
            {!isActive(data.vote) && tryGetTallyVisualizer(data) &&
                <Link to={`/vote/${data.vote.id}/visualize`}><Button style={{ marginBottom: "1em" }} variant="contained">Visualize</Button></Link>}
            {this.props.isAdmin && this.renderAdminZone(data)}
            {isActive(data.vote) && this.renderPartialBallotDialog(data)}
        </div>;
    }
}

export default VotePage;
