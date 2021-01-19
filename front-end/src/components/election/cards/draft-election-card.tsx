import React from "react";
import { Button, TextField, Typography, withStyles } from "@material-ui/core";
import { DateTimePicker } from "@material-ui/pickers";
import DeleteIcon from '@material-ui/icons/Delete';
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
};

type State = {
    /**
     * A ranking of vote options.
     * NOTE: this is not used for draft election cards;
     * rankings are computed on the fly.
     */
    ranking: string[];
};

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
        return <React.Fragment>
            <TitleTextField label="Vote title" value={vote.name} onChange={val =>
                this.props.onElectionChanged({ ...vote, name: val.target.value })} />;
            <DateTimePicker
                value={new Date(vote.deadline * 1000).toISOString()}
                label="Ballot boxes close:" onChange={date => {
                    if (date) {
                        this.props.onElectionChanged({ ...vote, deadline: date.unix() });
                    }
                }}
                style={{margin: "1em"}} />
            <MDEditor
                className="VoteDescription"
                value={vote.description}
                previewOptions={{escapeHtml: false, unwrapDisallowed: true}}
                onChange={val => this.props.onElectionChanged({ ...vote, description: val || "" })} />
        </React.Fragment>;
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
                {<Button onClick={() => this.onOptionDeleted(option)} className="DeleteVoteOptionButton"><DeleteIcon/></Button>}
            </div>
            <MDEditor
                className="VoteOptionDescription"
                value={option.description}
                previewOptions={{escapeHtml: false, unwrapDisallowed: true}}
                onChange={val => this.onOptionChanged(option, { ...option, description: val || "" })} />
        </CandidatePanel>;
    }
}

export default DraftElectionCard;
