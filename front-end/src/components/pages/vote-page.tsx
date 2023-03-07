import React, { Component, PureComponent } from "react";
import { Button, CircularProgress, Paper, Typography, DialogTitle, Dialog, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { Link } from "react-router-dom";
import { VoteAndBallots, Ballot, Vote, isActive, isCompletableBallot, completeBallot, isCompleteBallot, findIncompleteOptions, tryGetTallyVisualizer, VoteOption, tallyIndividual } from "../../model/vote";
import DropDownButton from "../drop-down-button";
import "./vote-page.css";
import { DangerButton } from "../danger-button";
import { CheckFab } from "../check-fab";
import WarningIcon from "@mui/icons-material/Warning";
import AddCandidateButton from "../add-candidate-button";
import ActiveElectionCard from "../election/cards/active-election-card";
import HistoricalElectionCard from "../election/cards/historical-election-card";
import { electsIndividuals, SuspiciousBallot } from "../../model/voting/types";
import saveAs from "file-saver";

type Props = {
    voteAndBallots: VoteAndBallots;
    suspiciousBallots?: SuspiciousBallot[];
    ballotCast?: boolean;
    onCastBallot?: (vote: Vote, ballot: Ballot) => void;
    isAdmin?: boolean;
    onCancelVote?: () => void;

    /**
     * A callback for when a winner resigns from their seat.
     */
    onResign?: (optionId: string) => void;
    onAddOption?: (option: VoteOption) => void;
};

type State = {
    ballot: Ballot | undefined;
    confirmingPartialBallot: boolean;
};

type AdminZoneProps = {
    data: VoteAndBallots;
    onCancelVote?: () => void;
    onResign?: (optionId: string) => void;
    onAddOption?: (option: VoteOption) => void;
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
        let canResign = !isActive(data.vote) && electsIndividuals(data.vote.type.tally) && onResign &&
            data.vote.options.length - (data.vote.resigned?.length || 0) > 0;
        let canAddOption = isActive(data.vote) && onResign;

        if (!canCancelVote && !canResign) {
            return <div/>;
        }

        let winners = canResign ? tallyIndividual(data) : [];

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
            {canAddOption &&
                <AddCandidateButton onAddCandidate={data => {
                    this.props.onAddOption!({
                        id: data.name.toLowerCase(),
                        name: data.name,
                        description: data.description,
                        ticket: [{
                            name: data.name,
                            affiliation: data.affiliation
                        }]
                    })
                }}>Add Candidate</AddCandidateButton>}
            <Button component={Link} to={`/vote/${data.vote.id}/edit`} variant="contained">Edit Vote</Button>
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

class SuspiciousBallotsPanel extends PureComponent<{ voteId: String, suspiciousBallots: SuspiciousBallot[] }> {
    onDownload() {
        let blob = new Blob([JSON.stringify(this.props.suspiciousBallots, undefined, 4)], {type: "application/json;charset=utf-8"});
        saveAs(blob, `${this.props.voteId}-suspicious-ballots.json`);
    }

    text() { 
        let count = this.props.suspiciousBallots.length;
        if (count === 1) {
            return "A suspicious ballot was detected.";
        } else {
            return `${count} suspicious ballots were detected.`;
        }
    }

    render() {
        return <Paper style={{ margin: "2em", padding: "1em", display: "flex", alignItems: "center",  }}>
            <WarningIcon fontSize="large" style={{ margin: "0 1em" }} />
            {this.text()}
            <Button style={{ margin: "0 1em" }} color="primary" onClick={this.onDownload.bind(this)}>
                Download Report
            </Button>
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
        return <AdminZone data={data} onCancelVote={this.props.onCancelVote} onResign={this.props.onResign} onAddOption={this.props.onAddOption} />;
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
            {this.props.suspiciousBallots
                && this.props.suspiciousBallots.length > 0
                && <SuspiciousBallotsPanel voteId={this.props.voteAndBallots.vote.id} suspiciousBallots={this.props.suspiciousBallots} />}
            {allowChanges
                ? <ActiveElectionCard
                    voteAndBallots={data}
                    onBallotChanged={newBallot => {
                        if (isActive(data.vote)) {
                            this.setState({ ...this.state, ballot: newBallot });
                        } else {
                            this.setState({ ...this.state });
                        }
                    }} />
                : <HistoricalElectionCard voteAndBallots={data} />}
            {isActive(data.vote)
                ? <div className="ProgressOrButton">{progressOrButton}</div>
                : <Button component={Link} to={`/vote/${data.vote.id}/ballots`} style={{ margin: "0 1em 1em 1em" }} variant="contained">View Ballots</Button>}
            {!isActive(data.vote) && tryGetTallyVisualizer(data) &&
                <Button component={Link} to={`/vote/${data.vote.id}/visualize`} style={{ margin: "0 1em 1em 1em" }} variant="contained">Visualize</Button>}
            {this.props.isAdmin && this.renderAdminZone(data)}
            {isActive(data.vote) && this.renderPartialBallotDialog(data)}
        </div>;
    }
}

export default VotePage;
