import React, { PureComponent } from "react";
import CheckIcon from '@material-ui/icons/Check';
import PlusIcon from '@material-ui/icons/Add';
import { Button, Theme, withStyles, TextField, CircularProgress } from "@material-ui/core";
import { green } from "@material-ui/core/colors";
import { Vote, BallotType } from "../../model/vote";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import ToggleButton from "@material-ui/lab/ToggleButton";
import { changeLuminance } from "../../model/util";
import ActiveElectionCard from "../election/cards/active-election-card";
import DraftElectionCard from "../election/cards/draft-election-card";

type Props = {
    hasSubmittedVote: boolean;
    draft: Vote;
    onUpdateDraft?: (draft: Vote) => void;
    onMakeVote?: (vote: Vote) => void;
};

const CheckButton = withStyles((theme: Theme) => ({
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
}))(Button);

const PlusButton = withStyles(() => ({
    root: {
        borderRadius: "100%",
        padding: "1em",
        margin: "0 0.5em"
    },
}))(Button);

const TallyButton = withStyles((theme: Theme) => ({
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
}))(ToggleButton);

const PositionsTextField = withStyles({
    root: {
        marginLeft: "1em",
        "& .MuiInputBase-root": {
            color: "white"
        },
        "& .MuiFormLabel-root": {
            color: "white"
        }
    }
})(TextField);

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
        this.updateDraft({
            ...this.props.draft,
            type: { tally: this.props.draft.type.tally, positions: newValue, min: 0, max: 5 }
        });
    }

    onMakeVote() {
        if (this.props.onMakeVote) {
            this.props.onMakeVote(this.props.draft);
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
                    <TallyButton disabled={this.props.hasSubmittedVote} value="first-past-the-post">FPTP</TallyButton>
                    <TallyButton disabled={this.props.hasSubmittedVote} value="star">STAR</TallyButton>
                    <TallyButton disabled={this.props.hasSubmittedVote} value="spsv">SPSV</TallyButton>
                </ToggleButtonGroup>
                {ballotType.tally === "spsv"
                    ? <PositionsTextField disabled={this.props.hasSubmittedVote} label="Number of Seats" value={ballotType.positions} type="number" onChange={this.onChangePositions.bind(this)} />
                    : []}
            </div>
            {this.props.hasSubmittedVote
                ? <ActiveElectionCard voteAndBallots={{ vote: this.props.draft, ballots: [] }} />
                : <DraftElectionCard
                    voteAndBallots={{ vote: this.props.draft, ballots: [] }}
                    onElectionChanged={this.updateDraft.bind(this)} />}
            {this.props.hasSubmittedVote ? [
                <CircularProgress />
            ] : [
                <PlusButton variant="contained" className="AddVoteOptionButton" onClick={this.addVoteOption.bind(this)} >
                    <PlusIcon fontSize="large" />
                </PlusButton>,
                <CheckButton variant="contained" className="MakeVoteButton" onClick={this.onMakeVote.bind(this)} >
                    <CheckIcon fontSize="large" />
                </CheckButton>
            ]}
        </div>;
    }
}

export default MakeVotePage;
