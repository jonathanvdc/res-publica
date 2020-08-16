import React, { Component } from "react";
import CheckIcon from '@material-ui/icons/Check';
import PlusIcon from '@material-ui/icons/Add';
import { Button, Theme, withStyles, TextField } from "@material-ui/core";
import { green, blue } from "@material-ui/core/colors";
import { Vote, BallotType } from "../model/vote";
import VoteCard from "./vote-card";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import ToggleButton from "@material-ui/lab/ToggleButton";

type Props = {};

type State = {
    vote: Vote;
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

const PlusButton = withStyles((theme: Theme) => ({
    root: {
        borderRadius: "100%",
        padding: "1em",
        margin: "0 0.5em"
    },
}))(Button);

const TallyButton = withStyles((theme: Theme) => ({
    root: {
        color: "white",
        backgroundColor: blue[500],
        '&:hover': {
            backgroundColor: blue[600],
        },
        '&.MuiToggleButton-root.Mui-selected': {
            color: "white",
            backgroundColor: blue[700],
            '&:hover': {
                backgroundColor: blue[800],
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
class MakeVotePage extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            vote: {
                id: 'new-vote',
                name: 'Vote Title',
                description: 'A vote on something.',
                deadline: Date.now() / 1000 + 60 * 60 * 24,
                options: [],
                type: {
                    tally: 'first-past-the-post'
                }
            }
        };
    }

    addVoteOption() {
        let vote = this.state.vote;
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
        this.setState({
            vote: {
                ...vote,
                options: [
                    ...vote.options,
                    {
                        id: voteId,
                        name: "New Option",
                        description: "Description goes here"
                    }]
            }
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
            case "spsv":
            default:
                type = { tally: "spsv", positions: 1, min: 1, max: 5 };
                break;
        }
        this.setState({
            vote: {
                ...this.state.vote,
                type
            }
        });
    }

    onChangePositions(arg: any) {
        let newValue: number = Number.parseInt(arg.target.value);
        if (newValue < 1 || !Number.isInteger(newValue)) {
            return;
        }
        this.setState({
            vote: {
                ...this.state.vote,
                type: { tally: "spsv", positions: newValue, min: 1, max: 5 }
            }
        });
    }

    render() {
        let ballotType = this.state.vote.type;
        return <div>
            <div style={{marginTop: "1em"}}>
                <ToggleButtonGroup
                    value={ballotType.tally}
                    exclusive
                    onChange={this.onChangeTallyType.bind(this)}>
                    <TallyButton value="first-past-the-post">FPTP</TallyButton>
                    <TallyButton value="spsv">SPSV</TallyButton>
                </ToggleButtonGroup>
                {ballotType.tally === "spsv"
                    ? <PositionsTextField label="Number of Positions" value={ballotType.positions} type="number" onChange={this.onChangePositions.bind(this)} />
                    : []}
            </div>
            <VoteCard
                allowVoteChanges={true}
                allowBallotChanges={false}
                voteAndBallots={{ vote: this.state.vote, ballots: [] }}
                onVoteChanged={vote => this.setState({ ...this.state, vote })} />
            <PlusButton variant="contained" color="primary" className="AddVoteOptionButton" onClick={this.addVoteOption.bind(this)} >
                <PlusIcon fontSize="large" />
            </PlusButton>
            <CheckButton variant="contained" className="MakeVoteButton" >
                <CheckIcon fontSize="large" />
            </CheckButton>
        </div>;
    }
}

export default MakeVotePage;
