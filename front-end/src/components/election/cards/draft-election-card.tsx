import React from "react";
import dayjs from "dayjs";
import { Button, Paper, TextField, Typography } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import { withStyles } from "tss-react/mui";
import DeleteIcon from '@mui/icons-material/Delete';
import { Vote, VoteAndBallots, VoteOption } from "../../../model/vote";
import CandidatePanel from "../candidate-panel";
import ElectionCard from "./election-card";
import MDEditor from "@uiw/react-md-editor";
import Ticket from "../ticket";

type Props = {
    voteAndBallots: VoteAndBallots;

    /**
     * A callback for when the user modifies the election.
     */
    onElectionChanged: (newElection: Vote) => void;

    /**
     * An optional argument that tells if options may be removed.
     * Defaults to true.
     */
    allowRemoveOptions?: boolean;

    /**
     * Tells if the election's end date may be adjusted.
     */
    allowChangeEnd?: boolean;
};

type State = {
    /**
     * A ranking of vote options.
     * NOTE: this is not used for draft election cards;
     * rankings are computed on the fly.
     */
    ranking: string[];
};

const TitleTextField = withStyles(
    TextField,
    {
        root: {
            "& .MuiInputBase-root": {
                // color: "white",
                fontSize: "xxx-large"
            },
            // "& .MuiFormLabel-root": {
            //     color: "gray"
            // }
        }
    });

const OptionTitleTextField = withStyles(
    TextField,
    {
        root: {
            "& .MuiInputBase-root": {
                fontSize: "xx-large"
            }
        }
    });

/**
 * A widget that allows users to create or edit an election.
 */
class DraftElectionCard extends ElectionCard<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = this.buildInitialState();
    }

    createHeader(): React.ReactNode {
        let vote = this.props.voteAndBallots.vote;
        return <Paper style={{padding: "1em"}}>
            <TitleTextField label="Vote title" value={vote.name} onChange={val =>
                this.props.onElectionChanged({ ...vote, name: val.target.value })} />
            {(this.props.allowChangeEnd ?? true) &&
                <DateTimePicker
                    value={dayjs(new Date(vote.deadline * 1000).toISOString())}
                    label="Ballot boxes close:" onChange={date => {
                        if (date) {
                            this.props.onElectionChanged({ ...vote, deadline: dayjs(date).unix() });
                        }
                    }}
                    sx={{margin: "1em"}} />}
            <MDEditor
                className="VoteDescription"
                value={vote.description}
                previewOptions={{unwrapDisallowed: true}}
                onChange={val => this.props.onElectionChanged({ ...vote, description: val || "" })} />
        </Paper>;
    }

    orderCandidates(election: VoteAndBallots): string[] {
        return election.vote.options.map(x => x.id);
    }

    /**
     * Gets the current ranking of candidates.
     */
    getRankedCandidates(): string[] {
        return this.orderCandidates(this.props.voteAndBallots);
    }

    onOptionChanged(oldOption: VoteOption, newOption: VoteOption) {
        let vote = this.props.voteAndBallots.vote;
        this.props.onElectionChanged({
            ...vote,
            options: vote.options.map(opt => opt.id === oldOption.id ? newOption : opt)
        });
    }

    onOptionDeleted(option: VoteOption) {
        let vote = this.props.voteAndBallots.vote;
        this.props.onElectionChanged({
            ...vote,
            options: vote.options.filter(opt => opt.id !== option.id)
        });
    }

    renderOption(option: VoteOption): React.ReactNode {
        let title: React.ReactNode;
        if (option.ticket) {
            // TODO: Make tickets editable too.
            title = <Typography className="VoteOption" variant="h4">
                <Ticket candidates={option.ticket} />
            </Typography>;
        } else {
            title = <OptionTitleTextField label="Vote title" value={option.name} onChange={val =>
                this.onOptionChanged(option, { ...option, name: val.target.value })} />;
        }

        return <CandidatePanel>
            <div className="EditableVoteOptionHeader">
                {title}
                {(this.props.allowRemoveOptions ?? true) &&
                    <Button onClick={() => this.onOptionDeleted(option)} className="DeleteVoteOptionButton"><DeleteIcon/></Button>
                }
            </div>
            <MDEditor
                className="VoteOptionDescription"
                value={option.description}
                previewOptions={{unwrapDisallowed: true}}
                onChange={val => this.onOptionChanged(option, { ...option, description: val || "" })} />
        </CandidatePanel>;
    }
}

export default DraftElectionCard;
