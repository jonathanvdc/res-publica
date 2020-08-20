import React, { PureComponent } from "react";
import { VoteAndBallots, Ballot, Vote, RateOptionsBallot, sortByString } from "../model/vote";
import "./vote-page.css";
import { Table, TableHead, TableCell, Paper, TableRow } from "@material-ui/core";

function getOptionScores(ballot: Ballot, vote: Vote): { optionId: string, rating: number }[] {
    if ('ratingPerOption' in ballot) {
        return ballot.ratingPerOption;
    } else {
        return vote.options.map(opt => ({ optionId: opt.id, rating: ballot.selectedOptionId === opt.id ? 1 : 0 }));
    }
}

function canonicalizeBallot(ballot: Ballot, vote: Vote): RateOptionsBallot {
    return { id: ballot.id, ratingPerOption: sortByString(getOptionScores(ballot, vote), x => x.optionId) };
}

function renderTableHeader(vote: Vote): string[] {
    return [
        "Ballot ID",
        ...sortByString(vote.options, x => x.id).map(x => x.name)
    ];
}

function renderTableBody(voteAndBallots: VoteAndBallots): string[][] {
    let canonicalizedBallots = voteAndBallots.ballots.map(
        ballot => canonicalizeBallot(ballot, voteAndBallots.vote));
    return canonicalizedBallots.map(ballot => [
        ballot.id || "",
        ...ballot.ratingPerOption.map(({ rating }) => rating.toString())
    ]);
}

/**
 * Generates a CSV file from a vote and its ballots.
 * @param voteAndBallots A vote and its ballots.
 */
export function ballotsToCsv(voteAndBallots: VoteAndBallots): string {
    let contents = [
        renderTableHeader(voteAndBallots.vote),
        ...renderTableBody(voteAndBallots)
    ];
    return contents.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

type Props = {
    voteAndBallots: VoteAndBallots;
};

/**
 * A table that visualizes all ballots.
 */
class BallotTable extends PureComponent<Props> {
    render() {
        let vote = this.props.voteAndBallots.vote;

        return <Paper>
            <Table>
                <TableHead>
                    {renderTableHeader(vote).map(x => <TableCell>{x}</TableCell>)}
                </TableHead>
                {renderTableBody(this.props.voteAndBallots).map(row =>
                    <TableRow>{row.map(cell =><TableCell>{cell}</TableCell>)}</TableRow>)}
            </Table>
        </Paper>;
    }
}

export default BallotTable;
