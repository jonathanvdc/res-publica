import { Chip } from "@material-ui/core";
import React, { PureComponent } from "react"
import { Candidate } from "../../model/vote";

type Props = {
    candidates: Candidate[];
};

/**
 * A ticket: a reference to a collection of candidates.
 */
class Ticket extends PureComponent<Props> {

    render() {
        let results = [];
        for (let candidate of this.props.candidates) {
            if (results.length > 0) {
                results.push(" & ");
            }

            let candidateBlockItems = [];
            candidateBlockItems.push(candidate.name);
            if (candidate.affiliation) {
                candidateBlockItems.push(<Chip style={{marginLeft: "0.5em"}} label={candidate.affiliation} />);
            }
            results.push(<div style={{display: "inline-block"}}>{candidateBlockItems}</div>)
        }

        return <React.Fragment>
            {results}
        </React.Fragment>;
    }
}

export default Ticket;
