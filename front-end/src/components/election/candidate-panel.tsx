import React, { PureComponent } from "react"
import { Paper, Typography } from "@mui/material";
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import ExitIcon from '@mui/icons-material/ExitToApp';
import "./candidate-panel.css";

type Props = {
    /**
     * Tells if this candidate has been selected by the user.
     */
    isSelected?: boolean;

    /**
     * Tells if a candidate is a winner.
     */
    isWinner?: boolean;

    /**
     * Tells if a candidate has resigned.
     */
    hasResigned?: boolean;

    /**
     * Represents a candidate's score.
     */
    score?: React.ReactNode;
};

/**
 * A panel that represents a candidate.
 */
class CandidatePanel extends PureComponent<Props> {

    render() {
        let outerContents: React.ReactNode;

        if (this.props.score || this.props.isWinner || this.props.hasResigned) {
            outerContents = <div className="CandidateResultPanel">
                <div className="CandidateOutcomePanel">
                    <Typography variant="h4">{this.props.score}</Typography>
                    {this.props.isWinner && <DoneOutlineIcon style={{fontSize: 40}} />}
                    {this.props.hasResigned && <ExitIcon style={{fontSize: 40}} />}
                </div>
                <div className="CandidateDescriptionPanel">{this.props.children}</div>
            </div>;
        } else {
            outerContents = this.props.children;
        }

        let isSelected = this.props.isSelected === undefined ? false : this.props.isSelected;
        return <Paper elevation={1} className={isSelected ? "CandidatePanel SelectedCandidatePanel" : "CandidatePanel"}>
            <div className="CandidatePanelContents">
                {outerContents}
            </div>
        </Paper>;
    }
}

export default CandidatePanel;
