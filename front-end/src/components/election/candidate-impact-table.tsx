import { Table, TableBody, TableCell, TableHead, TableRow } from "@material-ui/core";
import React, { PureComponent } from "react";
import { VoteOption } from "../../model/vote";
import { renderCandidateName } from "./candidate-name";
import UpIcon from '@material-ui/icons/ExpandLess';
import DownIcon from '@material-ui/icons/ExpandMore';

/**
 * The impact of a candidate's election on another candidate.
 */
export type CandidateImpact = {
    /**
     * The elected candidate that had an impact.
     */
    electedCandidate: VoteOption;

    /**
     * The other candidate's score before the candidate got elected.
     */
    scoreBefore: number;

    /**
     * The total score before the candidate got elected.
     */
    totalScoreBefore: number;

    /**
     * The other candidate's score after the candidate got elected.
     */
    scoreAfter: number;

    /**
     * The total score after the candidate got elected.
     */
    totalScoreAfter: number;
};

type Props = {
    /**
     * The candidates that had an impact on another candidate's score.
     */
    impacts: CandidateImpact[];
};

function renderPercentage(value: number, precision: number = 1): string {
    return `${(value * 100).toFixed(precision)}%`;
}

function renderChange(impact: CandidateImpact) {
    let diff = (impact.scoreAfter / impact.totalScoreAfter) / (impact.scoreBefore / impact.totalScoreBefore) - 1;
    if (diff === 0) {
        return renderPercentage(diff);
    } else if (diff < 0) {
        return <React.Fragment>
            {renderPercentage(-diff)}
            <DownIcon fontSize="inherit" htmlColor="#b71c1c" />
        </React.Fragment>;
    } else {
        return <React.Fragment>
            {renderPercentage(diff)}
            <UpIcon fontSize="inherit" htmlColor="#1b5e20" />
        </React.Fragment>;
    }
}

/**
 * A panel that represents a candidate.
 */
class CandidateImpactTable extends PureComponent<Props> {

    render() {
        return <Table style={{width: "auto"}}>
            <TableHead>
                <TableRow>
                    <TableCell>Elected Candidate</TableCell>
                    <TableCell align="right">Share of Total Score</TableCell>
                    <TableCell align="right">Change</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                <TableRow key="pre-vote">
                    <TableCell component="th" scope="row" />
                    <TableCell align="right">
                        {renderPercentage(this.props.impacts[0].scoreBefore / this.props.impacts[0].totalScoreBefore)}
                    </TableCell>
                    <TableCell align="right" />
                </TableRow>
                {this.props.impacts.map((impact, i) =>
                    <TableRow key={impact.electedCandidate.id}>
                        <TableCell component="th" scope="row">
                            {renderCandidateName(impact.electedCandidate)}
                        </TableCell>
                        <TableCell align="right">
                            {renderPercentage(impact.scoreAfter / impact.totalScoreAfter)}
                        </TableCell>
                        <TableCell align="right">
                            {renderChange(impact)}
                        </TableCell>
                    </TableRow>)}
            </TableBody>
        </Table>;
    }
}

export default CandidateImpactTable;
