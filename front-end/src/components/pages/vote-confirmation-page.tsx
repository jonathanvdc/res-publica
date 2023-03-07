import React, { PureComponent } from "react";
import CheckIcon from '@mui/icons-material/Check';
import { Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import "./vote-confirmation-page.css";

type Props = {
    ballotId: string;
};

/**
 * A page to confirm that a vote was cast.
 */
class VoteConfirmationPage extends PureComponent<Props> {
    render() {
        return <div>
            <CheckIcon style={{fontSize: 80}} />
            <Typography variant="h3">Thanks!</Typography>
            <Typography>Your ballot has been cast successfully with ballot ID <b>{this.props.ballotId}</b>.</Typography>
            <Link to="/" className="ReturnToVotesLink">
                <Button variant="contained" color="primary">Back to votes</Button>
            </Link>
        </div>;
    }
}

export default VoteConfirmationPage;
