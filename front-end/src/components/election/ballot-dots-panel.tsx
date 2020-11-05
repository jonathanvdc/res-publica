import React, { PureComponent } from "react";
import "./ballot-dots-panel.css";

/**
 * A panel designed to show dots for every ballot.
 */
class BallotDotsPanel extends PureComponent {
    render() {
        return <div className="BallotDotsOuterPanel">
            <div className="BallotDotsInnerPanel">
                {this.props.children}
            </div>
        </div>;
    }
}

export default BallotDotsPanel;
