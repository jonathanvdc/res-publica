import React, { PureComponent } from "react";
import { VoteAndBallots, Ballot, BallotType, VoteOption, RateOptionsBallot, ChooseOneBallot, isActive } from "../model/vote";
import ReactMarkdown from "react-markdown";
import Typography from '@material-ui/core/Typography';
import { Paper, withStyles, ButtonBase } from "@material-ui/core";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import MDEditor from '@uiw/react-md-editor';
import './vote-card.css';

type Props = {
    voteAndBallots: VoteAndBallots;
    allowVoteChanges?: boolean;
    allowBallotChanges?: boolean;
    onBallotChanged?: (newBallot: Ballot) => void;
};

function createEmptyBallot(type: BallotType): Ballot | undefined {
    switch (type.kind) {
        case "choose-one":
            return undefined;
        case "rate-options":
            return { ratingPerOption: [] };
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

function renderVoteOptionDescription(option: VoteOption, allowVoteChanges: boolean, onChange: (newValue: string) => void) {
    return [
        <Typography variant="h3" className="VoteOption">{option.name}</Typography>,
        createMDEditorOrPreview(option.description, "VoteOptionDescription", allowVoteChanges, onChange)
    ];
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
    changeBallot: (newBallot: Ballot) => void) {

    switch (ballotType.kind) {
        case "rate-options":
            let optionBallot = ballot as RateOptionsBallot;
            let ratingOrNull = optionBallot.ratingPerOption.find(val => val.optionId === option.id);
            let buttons = [];
            for (let i = ballotType.min; i <= ballotType.max; i++) {
                buttons.push(<ToggleButton disabled={!allowBallotChanges} value={i}>{i}</ToggleButton>);
            }
            return <Paper elevation={1} className="VotePanel">
                <div className="VotePanelContents">
                    {renderVoteOptionDescription(option, allowVoteChanges, newValue => option.description = newValue)}
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
        case "choose-one":
            let isSelected = ballot && (ballot as ChooseOneBallot).selectedOptionId === option.id;
            return <Paper elevation={1} className={isSelected ? "VotePanel SelectedVotePanel" : "VotePanel"}>
                <ButtonBase className="VotePanelButton" focusRipple disabled={!allowBallotChanges} onClick={() => changeBallot({ selectedOptionId: option.id })}>
                    <div className="VotePanelContents">
                        {renderVoteOptionDescription(option, allowVoteChanges, newValue => option.description = newValue)}
                    </div>
                </ButtonBase>
            </Paper>;
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
                    }));
        }

        return <div className="VoteContainer">
            <div className="VotePanelContents">
                <Typography variant="h2">{vote.name}</Typography>
                {createMDEditorOrPreview(vote.description, "VoteDescription", !!this.props.allowVoteChanges, newDesc => vote.description = newDesc)}
            </div>
            {options}
        </div>;
    }
}

export default VoteCard;
