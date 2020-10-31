import React, { PureComponent } from "react"
import { Paper } from "@material-ui/core";
import "./candidate-panel.css";

type Props = {
    isSelected?: boolean;
};

/**
 * A panel that represents a candidate.
 */
class CandidatePanel extends PureComponent<Props> {

    render() {
        let isSelected = this.props.isSelected === undefined ? false : this.props.isSelected;
        return <Paper elevation={1} className={isSelected ? "CandidatePanel SelectedCandidatePanel" : "CandidatePanel"}>
            <div className="CandidatePanelContents">
                {this.props.children}
            </div>
        </Paper>
    }
}

export default CandidatePanel;
