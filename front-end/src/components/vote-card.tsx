import React, { PureComponent } from "react";
import { VoteAndBallots, Ballot, BallotType, VoteOption, RateOptionsBallot, ChooseOneBallot, isActive, Vote, getBallotKind } from "../model/vote";
import ReactMarkdown from "react-markdown";
import Typography from '@material-ui/core/Typography';
import DeleteIcon from '@material-ui/icons/Delete';
import { Paper, withStyles, ButtonBase, TextField, Button } from "@material-ui/core";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import MDEditor from '@uiw/react-md-editor';
import './vote-card.css';

type Props = {
    voteAndBallots: VoteAndBallots;
    allowVoteChanges?: boolean;
    allowBallotChanges?: boolean;
    onBallotChanged?: (newBallot: Ballot) => void;
    onVoteChanged?: (newVote: Vote) => void;
};

function createEmptyBallot(type: BallotType): Ballot | undefined {
    switch (getBallotKind(type)) {
        case "choose-one":
            return undefined;
        case "rate-options":
            return { ratingPerOption: [] };
    }
}

const TitleTextField = withStyles({
    root: {
        "& .MuiInputBase-root": {
            color: "white",
            fontSize: "xxx-large"
        },
        "& .MuiFormLabel-root": {
            color: "gray"
        }
    }
})(TextField);

const OptionTitleTextField = withStyles({
    root: {
        "& .MuiInputBase-root": {
            fontSize: "xx-large"
        }
    }
})(TextField);

function createTitleEditorOrPreview(
    source: string,
    variant: "h2" | "h3",
    allowEdits: boolean,
    onChange: (newValue: string) => void): JSX.Element {

    if (allowEdits) {
        if (variant === "h2") {
            return <TitleTextField onChange={val => onChange(val.target.value)} value={source} />;
        } else {
            return <OptionTitleTextField onChange={val => onChange(val.target.value)} value={source} />;
        }
    } else {
        return <Typography variant={variant} className="VoteOption">{source}</Typography>;
    }
}

function createMDEditorOrPreview(
    source: string,
    className: string,
    allowEdits: boolean,
    onChange: (newValue: string) => void): JSX.Element {

    if (allowEdits) {
        return <MDEditor
            className={className}
            onChange={val => onChange(val || "")}
            value={source}
            previewOptions={{escapeHtml: false, unwrapDisallowed: true}} />;
    } else {
        return <ReactMarkdown
            className={className}
            source={source}
            escapeHtml={false}
            unwrapDisallowed={true} />;
    }
}

function renderVoteOptionDescription(
    option: VoteOption,
    allowVoteChanges: boolean,
    onChange: (newOption: VoteOption) => void,
    onDelete: () => void) {

    let results: JSX.Element[] = [];

    results.push(
        createTitleEditorOrPreview(
            option.name,
            "h3",
            allowVoteChanges,
            title => onChange({ ...option, name: title })));

    if (allowVoteChanges) {
        results.push(<Button onClick={onDelete} className="DeleteVoteOptionButton"><DeleteIcon/></Button>);
        results = [
            <div className="EditableVoteOptionHeader">{results}</div>
        ];
    }

    results.push(
        createMDEditorOrPreview(
            option.description,
            "VoteOptionDescription",
            allowVoteChanges,
            description => onChange({ ...option, description })))

    return results;
}

const StyledToggleButtonGroup = withStyles((theme) => ({
    grouped: {
      margin: theme.spacing(1),
      border: 'none',
      '&:not(:first-child)': {
        borderRadius: 100
      },
      '&:first-child': {
        borderRadius: 100
      }
    }
  }))(ToggleButtonGroup);

function renderVoteOption(
    option: VoteOption,
    ballotType: BallotType,
    allowVoteChanges: boolean,
    allowBallotChanges: boolean,
    ballot: Ballot | undefined,
    changeBallot: (newBallot: Ballot) => void,
    changeOption: (newOption: VoteOption) => void,
    deleteOption: () => void) {

    switch (ballotType.tally) {
        case "spsv":
            let optionBallot = ballot as RateOptionsBallot;
            let ratingOrNull = optionBallot.ratingPerOption.find(val => val.optionId === option.id);
            let buttons = [];
            for (let i = ballotType.min; i <= ballotType.max; i++) {
                buttons.push(<ToggleButton disabled={!allowBallotChanges} value={i}>{i}</ToggleButton>);
            }
            return <Paper elevation={1} className="VotePanel">
                <div className="VotePanelContents">
                    {renderVoteOptionDescription(
                        option,
                        allowVoteChanges,
                        changeOption,
                        deleteOption)}
                    <StyledToggleButtonGroup
                        value={ratingOrNull ? ratingOrNull.rating : null}
                        exclusive
                        onChange={(_event: React.MouseEvent<HTMLElement>, newValue: number | null) => {
                            let oldVals = optionBallot.ratingPerOption.filter(val => val.optionId !== option.id);
                            let newRatings = newValue === null ? optionBallot.ratingPerOption : [...oldVals, { optionId: option.id, rating: newValue }];
                            changeBallot({ ratingPerOption: newRatings });
                        }}>
                        {buttons}
                    </StyledToggleButtonGroup>
                </div>
            </Paper>;
        case "first-past-the-post":
            let isSelected = ballot && (ballot as ChooseOneBallot).selectedOptionId === option.id;
            let contents = <div className="VotePanelContents">
                {renderVoteOptionDescription(
                    option,
                    allowVoteChanges,
                    changeOption,
                    deleteOption)}
            </div>;
            if (allowVoteChanges) {
                return <Paper elevation={1} className={isSelected ? "VotePanel SelectedVotePanel" : "VotePanel"}>
                    {contents}
                </Paper>;
            } else {
                return <Paper elevation={1} className={isSelected ? "VotePanel SelectedVotePanel" : "VotePanel"}>
                    <ButtonBase className="VotePanelButton" focusRipple disabled={!allowBallotChanges} onClick={() => changeBallot({ selectedOptionId: option.id })}>
                        {contents}
                    </ButtonBase>
                </Paper>;
            }
    }
}

/**
 * A card that allows users to inspect and interact with a vote.
 */
class VoteCard extends PureComponent<Props> {
    render() {
        let vote = this.props.voteAndBallots.vote;
        let ballot = this.props.voteAndBallots.ownBallot || createEmptyBallot(vote.type);

        let options: JSX.Element[] = [];
        for (let option of vote.options) {
            options.push(
                renderVoteOption(
                    option,
                    vote.type,
                    !!this.props.allowVoteChanges,
                    this.props.allowBallotChanges === undefined ? isActive(vote) : this.props.allowBallotChanges,
                    ballot,
                    (newBallot: Ballot) => {
                        if (this.props.onBallotChanged) {
                            this.props.onBallotChanged(newBallot);
                        }
                    },
                    (newOption: VoteOption) => {
                        if (this.props.onVoteChanged) {
                            this.props.onVoteChanged({
                                ...vote,
                                options: [...vote.options.filter(opt => opt.id !== option.id), newOption]
                            });
                        }
                    },
                    () => {
                        if (this.props.onVoteChanged) {
                            this.props.onVoteChanged({
                                ...vote,
                                options: [...vote.options.filter(opt => opt.id !== option.id)]
                            });
                        }
                    }));
        }

        return <div className="VoteContainer">
            <div className="VotePanelContents">
                {createTitleEditorOrPreview(vote.name, "h2", !!this.props.allowVoteChanges, name => {
                    if (this.props.onVoteChanged) {
                        this.props.onVoteChanged({
                            ...vote,
                            name
                        });
                    }
                })}
                {createMDEditorOrPreview(vote.description, "VoteDescription", !!this.props.allowVoteChanges, description => {
                    if (this.props.onVoteChanged) {
                        this.props.onVoteChanged({
                            ...vote,
                            description
                        });
                    }
                })}
            </div>
            {options}
        </div>;
    }
}

export default VoteCard;
