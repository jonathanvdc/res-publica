import React, { Component } from "react";
import { VoteAndBallots, Ballot, BallotType, VoteOption, RateOptionsBallot } from "../model/vote";
import ReactMarkdown from "react-markdown";
import Typography from '@material-ui/core/Typography';
import { Paper, withStyles } from "@material-ui/core";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import './vote-card.css';

type Props = {
    voteAndBallots: VoteAndBallots;
};

type State = {
    ballot: Ballot | undefined;
};

function createEmptyBallot(type: BallotType): Ballot | undefined {
    switch (type.kind) {
        case "choose-one":
            return undefined;
        case "rate-options":
            return { ratingPerOption: [] };
    }
}

function renderVoteOptionDescription(option: VoteOption) {
    return [
        <Typography variant="h3" className="VoteOption">{option.name}</Typography>,
        <ReactMarkdown
            className="VoteOptionDescription"
            source={option.description}
            escapeHtml={false}
            unwrapDisallowed={true} />
    ];
}

const StyledToggleButtonGroup = withStyles((theme) => ({
    grouped: {
      margin: theme.spacing(0.5),
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
    ballot: Ballot | undefined,
    changeBallot: (newBallot: Ballot) => void) {

    switch (ballotType.kind) {
        case "rate-options":
            let optionBallot = ballot as RateOptionsBallot;
            let ratingOrNull = optionBallot.ratingPerOption.find(val => val.optionId === option.id);
            let buttons = [];
            for (let i = ballotType.min; i <= ballotType.max; i++) {
                buttons.push(<ToggleButton value={i}>{i}</ToggleButton>);
            }
            return <Paper elevation={1} className="VotePanel">
                {renderVoteOptionDescription(option)}
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
            </Paper>;
        case "choose-one":
            return <Paper elevation={1} className="VotePanel">
                {renderVoteOptionDescription(option)}
            </Paper>;
    }
}

/**
 * A card that allows users to inspect and interact with a vote.
 */
class VoteCard extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            ballot: this.props.voteAndBallots.ownBallot || createEmptyBallot(props.voteAndBallots.vote.type)
        };
    }

    render() {
        let vote = this.props.voteAndBallots.vote;
        let ballot = this.state.ballot;

        let options: JSX.Element[] = [];
        for (let option of vote.options) {
            options.push(
                renderVoteOption(
                    option,
                    vote.type,
                    ballot,
                    (newBallot: Ballot) => this.setState({ ...this.state, ballot: newBallot })));
        }

        return <div>
            <Paper elevation={1} className="VotePanel">
                <Typography variant="h2">{vote.name}</Typography>
                <ReactMarkdown
                    className="VoteDescription"
                    source={vote.description}
                    escapeHtml={false}
                    unwrapDisallowed={true} />
            </Paper>
            {options}
        </div>;
    }
}

export default VoteCard;
