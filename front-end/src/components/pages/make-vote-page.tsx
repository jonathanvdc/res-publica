import React, { PureComponent } from "react";
import CheckIcon from '@mui/icons-material/Check';
import PlusIcon from '@mui/icons-material/Add';
import { Button, Theme, TextField, CircularProgress, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { green } from "@mui/material/colors";
import { withStyles } from "tss-react/mui";
import { Vote, BallotType, TallyingAlgorithm, getBallotKind, ChooseOneBallotType } from "../../model/vote";
import { changeLuminance } from "../../model/util";
import ActiveElectionCard from "../election/cards/active-election-card";
import DraftElectionCard from "../election/cards/draft-election-card";

type Props = {
    hasSubmittedVote: boolean;
    draft: Vote;

    /**
     * Tells if options may be added to the ballot.
     * Defaults to true.
     */
    allowAddOptions?: boolean;

    /**
     * Tells if options may be removed from the ballot.
     * Defaults to true.
     */
    allowRemoveOptions?: boolean;

    /**
     * Tells if the end of the election may be changed.
     */
    allowChangeEnd?: boolean;

    /**
     * An optional list of allowed tallying algorithms.
     */
    allowedTallyingAlgorithms?: TallyingAlgorithm[];

    onUpdateDraft?: (draft: Vote) => void;
    onMakeVote?: (vote: Vote) => void;
};

const CheckButton = withStyles(
    Button,
    (theme: Theme) => ({
        root: {
            borderRadius: "100%",
            padding: "1em",
            margin: "0 0.5em",
            color: theme.palette.getContrastText(green[600]),
            backgroundColor: green[600],
            '&:hover': {
                backgroundColor: green[700],
            },
        },
    }));

const PlusButton = withStyles(
    Button,
    () => ({
        root: {
            borderRadius: "100%",
            padding: "1em",
            margin: "0 0.5em"
        },
    }));

const TallyButton = withStyles(
    ToggleButton,
    (theme: Theme) => ({
        root: {
            color: "white",
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
                backgroundColor: theme.palette.primary.dark,
            },
            '&.MuiToggleButton-root.Mui-selected': {
                color: "white",
                backgroundColor: changeLuminance(theme.palette.primary.dark, -0.1),
                '&:hover': {
                    backgroundColor: changeLuminance(theme.palette.primary.dark, -0.1),
                }
            },
        },
    }));

const PositionsTextField = withStyles(
    TextField, {
    root: {
        marginLeft: "1em",
        "& .MuiInputBase-root": {
            color: "white"
        },
        "& .MuiFormLabel-root": {
            color: "white"
        }
    }
});

/**
 * A page that allows an admin to create a vote.
 */
class MakeVotePage extends PureComponent<Props> {
    updateDraft(draft: Vote) {
        if (this.props.onUpdateDraft) {
            this.props.onUpdateDraft(draft);
        }
    }

    addVoteOption() {
        let vote = this.props.draft;
        let voteIdIndex = 0;
        let voteId: string;
        while (true) {
            voteIdIndex++;
            voteId = `option-${voteIdIndex}`;
            let voteIdCopy = voteId;
            if (!vote.options.find(({ id: existingId }) => existingId === voteIdCopy)) {
                break;
            }
        }
        this.updateDraft({
            ...this.props.draft,
            options: [
                ...this.props.draft.options,
                { id: voteId, name: "New Option", description: "Put your description here." }
            ]
        });
    }

    onChangeTallyType(_event: React.MouseEvent<HTMLElement, MouseEvent>, value: string | null) {
        if (!value) {
            return;
        }

        let type: BallotType;
        switch (value) {
            case "first-past-the-post":
                type = { tally: "first-past-the-post" };
                break;
            case "sainte-lague":
                type = { tally: "sainte-lague", positions: 1 };
                break;
            case "simdem-sainte-lague":
                type = { tally: "simdem-sainte-lague" };
                break;
            case "stv":
                type = { tally: "stv", positions: 1 };
                break;
            case "star":
                type = { tally: "star", positions: 1, min: 0, max: 5 };
                break;
            case "spsv":
            default:
                type = { tally: "spsv", positions: 1, min: 0, max: 5 };
                break;
        }
        this.updateDraft({
            ...this.props.draft,
            type
        });;
    }

    onChangePositions(arg: any) {
        let newValue: number = Number.parseInt(arg.target.value);
        if (newValue < 1 || !Number.isInteger(newValue)) {
            return;
        }

        if (getBallotKind(this.props.draft.type) === "rate-options") {
            this.updateDraft({
                ...this.props.draft,
                type: { tally: this.props.draft.type.tally, positions: newValue, min: 0, max: 5 }
            });
        } else {
            this.updateDraft({
                ...this.props.draft,
                type: { tally: this.props.draft.type.tally, positions: newValue } as ChooseOneBallotType
            });
        }
    }

    onMakeVote() {
        if (this.props.onMakeVote) {
            this.props.onMakeVote(this.props.draft);
        }
    }

    isAllowedAlgorithm(algorithm: TallyingAlgorithm): boolean {
        if (this.props.allowedTallyingAlgorithms) {
            return this.props.allowedTallyingAlgorithms.includes(algorithm);
        } else {
            return true;
        }
    }

    allowSeatCountTweaking(algorithm: TallyingAlgorithm): boolean {
        switch (algorithm) {
            case "first-past-the-post":
            case "star":
            case "simdem-sainte-lague":
                return false;

            case "sainte-lague":
            case "spsv":
            case "stv":
                return true;
        }
    }

    render() {
        let ballotType = this.props.draft.type;
        return <div>
            <div style={{marginTop: "1em"}}>
                <ToggleButtonGroup
                    value={ballotType.tally}
                    exclusive
                    onChange={this.onChangeTallyType.bind(this)}>
                    {this.isAllowedAlgorithm("first-past-the-post") &&
                        <TallyButton disabled={this.props.hasSubmittedVote} value="first-past-the-post">FPTP</TallyButton>}
                    {/* {this.isAllowedAlgorithm("stv") &&
                        <TallyButton disabled={this.props.hasSubmittedVote} value="stv">STV</TallyButton>} */}
                    {this.isAllowedAlgorithm("sainte-lague") &&
                        <TallyButton disabled={this.props.hasSubmittedVote} value="sainte-lague">Sainte-Lague</TallyButton>}
                    {this.isAllowedAlgorithm("simdem-sainte-lague") &&
                        <TallyButton disabled={this.props.hasSubmittedVote} value="simdem-sainte-lague">SDSL</TallyButton>}
                    {this.isAllowedAlgorithm("star") &&
                        <TallyButton disabled={this.props.hasSubmittedVote} value="star">STAR</TallyButton>}
                    {this.isAllowedAlgorithm("spsv") &&
                        <TallyButton disabled={this.props.hasSubmittedVote} value="spsv">SPSV</TallyButton>}
                </ToggleButtonGroup>
                {this.allowSeatCountTweaking(ballotType.tally)
                    ? <PositionsTextField disabled={this.props.hasSubmittedVote} label="Number of Seats" value={ballotType.positions} type="number" onChange={this.onChangePositions.bind(this)} />
                    : []}
            </div>
            {this.props.hasSubmittedVote
                ? <ActiveElectionCard voteAndBallots={{ vote: this.props.draft, ballots: [] }} />
                : <DraftElectionCard
                    voteAndBallots={{ vote: this.props.draft, ballots: [] }}
                    onElectionChanged={this.updateDraft.bind(this)}
                    allowRemoveOptions={this.props.allowRemoveOptions}
                    allowChangeEnd={this.props.allowChangeEnd} />}
            {this.props.hasSubmittedVote ?
                <CircularProgress />
            : <React.Fragment>
                {(this.props.allowAddOptions ?? true) &&
                    <PlusButton variant="contained" className="AddVoteOptionButton" onClick={this.addVoteOption.bind(this)}>
                        <PlusIcon fontSize="large" />
                    </PlusButton>}
                <CheckButton variant="contained" className="MakeVoteButton" onClick={this.onMakeVote.bind(this)}>
                    <CheckIcon fontSize="large" />
                </CheckButton>
            </React.Fragment>}
        </div>;
    }
}

export default MakeVotePage;
