import React from "react";
import { ButtonBase, Typography, withStyles } from "@material-ui/core";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import CountdownTimer from 'react-countdown';
import { getPreferences } from "../../../model/preferences";
import { Ballot, BallotType, getBallotKind, RateOptionsBallot, RateOptionsBallotType, VoteAndBallots, VoteOption } from "../../../model/vote";
import { renderCollapsibleMarkdown } from "../../widgets/collapsible-markdown";
import { renderCandidateName } from "../candidate-name";
import CandidatePanel from "../candidate-panel";
import ElectionCard from "./election-card";

type Props = {
    voteAndBallots: VoteAndBallots;

    /**
     * A callback for when the user modifies their ballot.
     */
    onBallotChanged?: (newBallot: Ballot) => void;

    /**
     * A callback for when the election ends.
     */
    onElectionEnded?: () => void;
};

type State = {
    /**
     * A ranking of vote options.
     */
    ranking: string[];

    /**
     * Tells if descriptions can be collapsed.
     */
    areDescriptionsCollapsible: boolean;

    /**
     * Tells if descriptions should be collapsed by default.
     */
    collapseDescriptionsByDefault: boolean;
};

type TimeLeft = {
    hours: number;
    minutes: number;
    seconds: number;
    completed: boolean;
}

function renderNumberAndUnit(value: number, unit: string): string {
    if (value === 1) {
        return `${value} ${unit}`;
    } else {
        return `${value} ${unit}s`;
    }
}

function renderSequenceOfUnits(seq: { value: number, unit: string}[]): string {
    if (seq.length === 0) {
        return "";
    } else if (seq.length === 1) {
        // Fall through.
    } else if (seq[0].value === 0) {
        return renderSequenceOfUnits(seq.slice(1));
    } else if (seq[0].value === 1) {
        let first = renderNumberAndUnit(seq[0].value, seq[0].unit);
        if (seq[1].value > 0) {
            return `${first} and ${renderNumberAndUnit(seq[1].value, seq[1].unit)}`;
        }
    }

    return renderNumberAndUnit(seq[0].value, seq[0].unit);
}

function renderTimeLeftMessage({ hours, minutes, seconds, completed }: TimeLeft): string {
    if (completed) {
        return "Vote closed";
    } else {
        return "Vote closes in " + renderSequenceOfUnits([
            { value: hours, unit: "hour" },
            { value: minutes, unit: "minute" },
            { value: seconds, unit: "second" },
        ]);
    }
}

function renderTimeLeft(timeLeft: TimeLeft): JSX.Element {
    return <Typography variant="button">{renderTimeLeftMessage(timeLeft)}</Typography>;
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

/**
 * A widget that allows users to inspect and interact with an active election.
 */
class ActiveElectionCard extends ElectionCard<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = this.buildInitialState();
    }

    buildInitialState(): State {
        return {
            ...super.buildInitialState(),
            collapseDescriptionsByDefault: getPreferences().collapseDescriptionsByDefault,
            areDescriptionsCollapsible: getBallotKind(this.props.voteAndBallots.vote.type) === 'rate-options'
        };
    }

    createHeader(): React.ReactNode {
        let vote = this.props.voteAndBallots.vote;
        return <React.Fragment>
            <Typography variant="h2" className="VoteOption">{vote.name}</Typography>
            <CountdownTimer date={vote.deadline * 1000} renderer={renderTimeLeft} onComplete={this.props.onElectionEnded} />
            {renderCollapsibleMarkdown(
                vote.description,
                "VoteDescription",
                this.state.areDescriptionsCollapsible,
                this.state.collapseDescriptionsByDefault)}
        </React.Fragment>;
    }

    orderCandidates(election: VoteAndBallots): string[] {
        return election.vote.options.map(x => x.id);
    }

    renderOption(option: VoteOption): React.ReactNode {
        return <CandidatePanel>
            {this.addOptionControls(
                option,
                <React.Fragment>
                    <Typography className="VoteOption" variant="h4">{renderCandidateName(option)}</Typography>
                    {renderCollapsibleMarkdown(
                        option.description,
                        "VoteOptionDescription",
                        this.state.areDescriptionsCollapsible,
                        this.state.collapseDescriptionsByDefault)}
                </React.Fragment>
            )}
        </CandidatePanel>;
    }

    addOptionControls(option: VoteOption, body: React.ReactNode): React.ReactNode {
        if (!this.props.onBallotChanged) {
            return body;
        }
        let changeBallot = this.props.onBallotChanged;

        let vote = this.props.voteAndBallots.vote;
        switch (getBallotKind(vote.type)) {
            case 'choose-one':
            {
                return <ButtonBase
                    className="CandidatePanelButton"
                    focusRipple
                    onClick={() => changeBallot({ selectedOptionId: option.id })}>

                    <div>{body}</div>
                </ButtonBase>;
            }
            case 'rate-options':
            {
                let ballotType = vote.type as RateOptionsBallotType;
                let optionBallot = (this.props.voteAndBallots.ownBallot || { ratingPerOption: [] }) as RateOptionsBallot;
                let ratingOrNull = optionBallot.ratingPerOption.find(val => val.optionId === option.id);
                let buttons = [];
                for (let i = ballotType.min; i <= ballotType.max; i++) {
                    buttons.push(<ToggleButton value={i}>{i}</ToggleButton>);
                }
                return <React.Fragment>
                    {body}
                    <StyledToggleButtonGroup
                        value={ratingOrNull ? ratingOrNull.rating : null}
                        exclusive
                        onChange={(_event: React.MouseEvent<HTMLElement>, newValue: number | null) => {
                            let oldVals = optionBallot.ratingPerOption.filter(val => val.optionId !== option.id);
                            let newRatings = newValue === null
                                ? optionBallot.ratingPerOption
                                : [...oldVals, { optionId: option.id, rating: newValue }];
                            changeBallot({ ratingPerOption: newRatings });
                        }}>
                        {buttons}
                    </StyledToggleButtonGroup>
                </React.Fragment>;
            }
        }
    }
}

export default ActiveElectionCard;
