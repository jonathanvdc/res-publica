import { Chip } from "@material-ui/core";
import React, { PureComponent } from "react"
import { Candidate } from "../../model/vote";

type Props = {
    /**
     * The weights assigned to each of the ballot's dots.
     */
    dotWeights: number[];
};

function toPercentage(value: number): string {
    return `${Math.round(value * 100)}%`;
}

/**
 * A representation of a ballot as a set of dots, each of which
 * representing a virtual ballot that may be weighted.
 */
class BallotDots extends PureComponent<Props> {

    render() {
        return <div style={{display: "inline-block"}}>
            {this.props.dotWeights.map(w =>
                <div style={{
                    display: "inline-block",
                    width: "0.5em",
                    height: "0.5em",
                    borderRadius: "100%",
                    background: `linear-gradient(to right, #159957 ${toPercentage(w - 0.01)}, transparent ${toPercentage(w + 0.01)})`}} />)}
        </div>;
    }
}

export default BallotDots;
