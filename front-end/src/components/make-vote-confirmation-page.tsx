import React, { PureComponent } from "react";
import CheckIcon from '@material-ui/icons/Check';
import { Typography, Button } from "@material-ui/core";
import { Link } from "react-router-dom";
import "./vote-confirmation-page.css";

type Props = {
    voteId: string;
};

/**
 * A page to confirm that a vote was created.
 */
class MakeVoteConfirmationPage extends PureComponent<Props> {
    render() {
        return <div>
            <CheckIcon style={{fontSize: 80}} />
            <Typography variant="h3">Thanks!</Typography>
            <Typography>Your vote has been created successfully with vote ID <b>{this.props.voteId}</b>.</Typography>
            <Link to={`/vote/${this.props.voteId}`} className="ReturnToVotesLink">
                <Button variant="contained" color="primary">To the vote</Button>
            </Link>
        </div>;
    }
}

export default MakeVoteConfirmationPage;
