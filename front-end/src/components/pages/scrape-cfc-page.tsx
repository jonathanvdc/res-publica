import React, { Component } from "react";
import CheckIcon from '@material-ui/icons/Check';
import { Button, TextField, Paper, Typography, Checkbox, FormControlLabel } from "@material-ui/core";
import { Vote } from "../../model/vote";

type Props = {
    scrape: (postUrl: string, detectCandidates: boolean) => Promise<Vote>;
    onSubmitDraft: (draft?: Vote) => void;
};

type State = {
    postUrl: string;
    detectCandidates: boolean;
    vote?: Vote;
    scrapedSuccessfully?: boolean;
};

function createVerticalDivider() {
    return <div style={{ flexGrow: 1, display: "flex", alignItems: "center", "justifyContent": "center" }}>
        <div style={{ width: "1px", height: "100%", backgroundColor: "white" }} />
    </div>;
}

/**
 * A page that allows an admin to scrape a CFC from a Reddit post.
 */
class ScrapeCFCPage extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            postUrl: "",
            detectCandidates: true
        };
    }

    onUrlChange(event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
        let postUrl = event.target.value;
        this.scrape(postUrl, this.state.detectCandidates);
    }

    async scrape(postUrl: string, detectCandidates: boolean) {
        this.setState({ postUrl, detectCandidates });
        try {
            let vote = await this.props.scrape(postUrl, detectCandidates);
            if (this.state.postUrl === postUrl && this.state.detectCandidates === detectCandidates) {
                this.setState({ postUrl, vote, scrapedSuccessfully: true });
            }
        } catch (ex) {
            this.setState({ ...this.state, scrapedSuccessfully: false });
        }
    }

    onDetectCandidatesChange(event: React.ChangeEvent<HTMLInputElement>, checked: boolean) {
        this.scrape(this.state.postUrl, checked);
    }

    onCreateEmptyVote() {
        this.props.onSubmitDraft(undefined);
    }

    onCreateVoteFromCfc() {
        this.props.onSubmitDraft(this.state.vote);
    }

    render() {
        return <div>
            <Typography variant="h1">New Vote</Typography>
            <div style={{ display: "flex", marginTop: "1em" }}>
                <Paper style={{ flexBasis: "100%" }}>
                    <div style={{ padding: "1em" }}>
                        <Typography variant="button">Scrape from CFC</Typography>
                        <TextField
                            style={{ width: "100%", marginTop: "1em" }}
                            error={'scrapedSuccessfully' in this.state && !this.state.scrapedSuccessfully}
                            label="Post URL"
                            variant="outlined"
                            value={this.state.postUrl}
                            onChange={this.onUrlChange.bind(this)} />
                        <div>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={this.state.detectCandidates}
                                        onChange={this.onDetectCandidatesChange.bind(this)}
                                        color="primary" />
                                }
                                label="Fancy candidates" />
                        </div>
                        <Button disabled={!this.state.scrapedSuccessfully} style={{ marginTop: "1em" }} onClick={this.onCreateVoteFromCfc.bind(this)}>
                            <CheckIcon />
                        </Button>
                    </div>
                </Paper>
                <div style={{ display: "flex", flexDirection: "column", margin: "1em" }}>
                    {createVerticalDivider()}
                    <Typography>OR</Typography>
                    {createVerticalDivider()}
                </div>
                <Paper style={{ flexBasis: "100%" }}>
                    <Button style={{ width: "100%", height: "100%" }} onClick={this.onCreateEmptyVote.bind(this)}>Build from scratch</Button>
                </Paper>
            </div>
        </div>;
    }
}

export default ScrapeCFCPage;
