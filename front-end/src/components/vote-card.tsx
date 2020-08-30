import React, { Component } from "react";
import { VoteAndBallots, Ballot, BallotType, VoteOption, RateOptionsBallot, ChooseOneBallot, isActive, Vote, getBallotKind, tally, Candidate, tallyOrder } from "../model/vote";
import ReactMarkdown from "react-markdown";
import Typography from '@material-ui/core/Typography';
import DeleteIcon from '@material-ui/icons/Delete';
import { Paper, withStyles, ButtonBase, TextField, Button, Collapse, Chip } from "@material-ui/core";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import MDEditor from '@uiw/react-md-editor';
import { DateTimePicker } from '@material-ui/pickers'
import DoneOutlineIcon from '@material-ui/icons/DoneOutline';
import ExitIcon from '@material-ui/icons/ExitToApp';
import CountdownTimer from 'react-countdown';
import './vote-card.css';
import { getPreferences } from "../model/preferences";

type Props = {
    voteAndBallots: VoteAndBallots;
    allowVoteChanges?: boolean;
    allowBallotChanges?: boolean;
    onBallotChanged?: (newBallot: Ballot) => void;
    onVoteChanged?: (newVote: Vote) => void;
};

type State = {
    currentTime: number;
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
            // color: "white",
            fontSize: "xxx-large"
        },
        // "& .MuiFormLabel-root": {
        //     color: "gray"
        // }
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
    variant: "h2" | "h4",
    allowEdits: boolean,
    onChange: (newValue: string) => void): JSX.Element {

    if (allowEdits) {
        if (variant === "h2") {
            return <TitleTextField label="Vote title" onChange={val => onChange(val.target.value)} value={source} />;
        } else {
            return <OptionTitleTextField label="Option title" onChange={val => onChange(val.target.value)} value={source} />;
        }
    } else {
        return <Typography variant={variant} className="VoteOption">{source}</Typography>;
    }
}

class CollapsibleMarkdown extends Component<any, { isCollapsed: boolean }> {
    constructor(props: any) {
        super(props);
        let prefs = getPreferences();
        this.state = { isCollapsed: prefs.collapseDescriptionsByDefault };
    }

    onToggleCollapsed() {
        this.setState({ isCollapsed: !this.state.isCollapsed });
    }

    render() {
        let content: JSX.Element;
        let buttonText: string;
        if (this.state.isCollapsed) {
            content = <Collapse collapsedHeight="5em">
                <ReactMarkdown {...this.props} />
            </Collapse>;
            buttonText = "Read more";
        } else {
            content = <ReactMarkdown {...this.props} />;
            buttonText = "Read less";
        }
        return <div>
            {content}
            <div style={{display: "flex"}}><Button color="primary" onClick={this.onToggleCollapsed.bind(this)}>{buttonText}</Button></div>
        </div>;
    }
}

function countLines(source: string, lineLength: number = 80): number {
    let lineCount = 0;
    let emptyLineCount = 0;
    let whitespaceRegex = /^\s+$/;
    for (let line of source.split("\n")) {
        if (!line || whitespaceRegex.test(line)) {
            emptyLineCount++;
        } else {
            if (emptyLineCount > 0) {
                lineCount++;
            }

            lineCount += Math.ceil(line.length / lineLength);
            emptyLineCount = 0;
        }
    }
    return lineCount;
}

function createMDEditorOrPreview(
    source: string,
    className: string,
    allowEdits: boolean,
    onChange: (newValue: string) => void,
    allowCollapse: boolean = true): JSX.Element {

    if (allowEdits) {
        return <MDEditor
            className={className}
            onChange={val => onChange(val || "")}
            value={source}
            previewOptions={{escapeHtml: false, unwrapDisallowed: true}} />;
    } else {
        const maxLines = 4;
        if (allowCollapse && countLines(source) > maxLines) {
            return <CollapsibleMarkdown
                className={className}
                source={source}
                escapeHtml={false}
                unwrapDisallowed={true} />;
        } else {
            return <ReactMarkdown
                className={className}
                source={source}
                escapeHtml={false}
                unwrapDisallowed={true} />;
        }
    }
}

function renderTicket(ticket: Candidate[]): (JSX.Element | string)[] {
    let results = [];
    for (let candidate of ticket) {
        if (results.length > 0) {
            results.push(" & ");
        }

        let candidateBlockItems = [];
        candidateBlockItems.push(candidate.name);
        if (candidate.affiliation) {
            candidateBlockItems.push(<Chip style={{marginLeft: "0.5em"}} label={candidate.affiliation} />);
        }
        results.push(<div style={{display: "inline-block"}}>{candidateBlockItems}</div>)
    }
    return results;
}

function renderVoteOptionDescription(
    option: VoteOption,
    allowVoteChanges: boolean,
    onChange: (newOption: VoteOption) => void,
    onDelete: () => void) {

    let results: JSX.Element[] = [];

    if (option.ticket) {
        results.push(<Typography className="VoteOption" variant="h4">{renderTicket(option.ticket)}</Typography>);
    } else {
        results.push(
            createTitleEditorOrPreview(
                option.name,
                "h4",
                allowVoteChanges,
                title => onChange({ ...option, name: title })));
    }

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

function renderVoteResult(description: JSX.Element[], isWinner: boolean, hasResigned: boolean, score: string): JSX.Element[] {
    return [
        <div className="VoteResultPanel">
            <div className="VoteOutcomePanel">
                <Typography variant="h4">{score}</Typography>
                {isWinner && <DoneOutlineIcon style={{fontSize: 40}} />}
                {hasResigned && <ExitIcon style={{fontSize: 40}} />}
            </div>
            <div className="VoteDescriptionPanel">{description}</div>
        </div>
    ];
}

type TalliedVote = {
    voteAndBallots: VoteAndBallots;
    winners: string[];
    ranking: string[];
}

function renderVoteOption(
    option: VoteOption,
    vote: TalliedVote,
    allowVoteChanges: boolean,
    allowBallotChanges: boolean,
    ballot: Ballot | undefined,
    changeBallot: (newBallot: Ballot) => void,
    changeOption: (newOption: VoteOption) => void,
    deleteOption: () => void) {

    let ballotType = vote.voteAndBallots.vote.type;
    let description = renderVoteOptionDescription(
        option,
        allowVoteChanges,
        changeOption,
        deleteOption);

    switch (ballotType.tally) {
        case "spsv":
            if (vote.winners.length > 0) {
                let isWinner = vote.winners.includes(option.id);
                let hasResigned = !!vote.voteAndBallots.vote.resigned?.includes(option.id);
                let rankingIndex = vote.ranking.indexOf(option.id);
                description = renderVoteResult(description, isWinner, hasResigned, `#${rankingIndex + 1}`)
            }

            let optionBallot = ballot as RateOptionsBallot;
            let ratingOrNull = optionBallot.ratingPerOption.find(val => val.optionId === option.id);
            let buttons = [];
            for (let i = ballotType.min; i <= ballotType.max; i++) {
                buttons.push(<ToggleButton disabled={!allowBallotChanges} value={i}>{i}</ToggleButton>);
            }
            return <Paper elevation={1} className="VotePanel">
                <div className="VotePanelContents">
                    {description}
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
            if (vote.winners.length > 0) {
                let ballots = vote.voteAndBallots.ballots;
                let votePercentage = ballots.filter(x => (x as ChooseOneBallot).selectedOptionId === option.id).length / ballots.length;
                console.log(vote.ranking);
                description = renderVoteResult(
                    description,
                    vote.winners.includes(option.id),
                    !!vote.voteAndBallots.vote.resigned?.includes(option.id),
                    `${Math.round(100 * votePercentage)}%`)
            }

            let contents = <div className="VotePanelContents">
                {description}
            </div>;

            if (allowVoteChanges || !allowBallotChanges) {
                return <Paper elevation={1} className={isSelected ? "VotePanel SelectedVotePanel" : "VotePanel"}>
                    {contents}
                </Paper>;
            } else {
                return <Paper elevation={1} className={isSelected ? "VotePanel SelectedVotePanel" : "VotePanel"}>
                    <ButtonBase className="VotePanelButton" focusRipple onClick={() => changeBallot({ selectedOptionId: option.id })}>
                        {contents}
                    </ButtonBase>
                </Paper>;
            }
    }
}

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

function createTimerOrTimePicker(
    deadline: number,
    allowVoteChanges: boolean,
    onChangeDeadline: (newDeadline: number) => void,
    onTimerCompleted: () => void) {

    if (allowVoteChanges) {
        return <DateTimePicker
            value={new Date(deadline * 1000).toISOString()}
            label="Vote closes on" onChange={date => {
                if (date) {
                    onChangeDeadline(date.unix());
                }
            }}
            style={{margin: "1em"}} />;
    } else {
        return <CountdownTimer date={deadline * 1000} renderer={renderTimeLeft} onComplete={onTimerCompleted} />;
    }
}

/**
 * A card that allows users to inspect and interact with a vote.
 */
class VoteCard extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { currentTime: Date.now() };
    }

    onTimerCompleted() {
        this.setState({ currentTime: Date.now() });
    }

    render() {
        let vote = this.props.voteAndBallots.vote;
        let ballot = this.props.voteAndBallots.ownBallot || createEmptyBallot(vote.type);
        let shouldTally = this.props.voteAndBallots.ballots.length > 0;
        let ranking = shouldTally
            ? tallyOrder(this.props.voteAndBallots)
            : vote.options.map(x => x.id);
        let talliedVote = {
            voteAndBallots: this.props.voteAndBallots,
            winners: shouldTally ? tally(this.props.voteAndBallots) : [],
            ranking
        };

        let options: JSX.Element[] = [];
        for (let option of vote.options.sort((a, b) => ranking.indexOf(a.id) - ranking.indexOf(b.id))) {
            options.push(
                renderVoteOption(
                    option,
                    talliedVote,
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
                                options: vote.options.map(opt => opt.id === option.id ? newOption : opt)
                            });
                        }
                    },
                    () => {
                        if (this.props.onVoteChanged) {
                            this.props.onVoteChanged({
                                ...vote,
                                options: vote.options.filter(opt => opt.id !== option.id)
                            });
                        }
                    }));
        }

        let header = [
            createTitleEditorOrPreview(vote.name, "h2", !!this.props.allowVoteChanges, name => {
                if (this.props.onVoteChanged) {
                    this.props.onVoteChanged({
                        ...vote,
                        name
                    });
                }
            }),
            createTimerOrTimePicker(
                vote.deadline,
                !!this.props.allowVoteChanges,
                deadline => {
                    if (this.props.onVoteChanged) {
                        this.props.onVoteChanged({
                            ...vote,
                            deadline
                        });
                    }
                },
                this.onTimerCompleted.bind(this)),
            createMDEditorOrPreview(vote.description, "VoteDescription", !!this.props.allowVoteChanges, description => {
                if (this.props.onVoteChanged) {
                    this.props.onVoteChanged({
                        ...vote,
                        description
                    });
                }
            }, false)
        ];

        if (this.props.allowVoteChanges) {
            header = [<Paper style={{padding: "1em"}}>{header}</Paper>];
        }

        return <div className="VoteContainer">
            <div className="VotePanelContents">
                {header}
            </div>
            {options}
        </div>;
    }
}

export default VoteCard;
