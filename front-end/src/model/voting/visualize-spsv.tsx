import React, { ReactNode } from "react";
import { Typography } from "@material-ui/core";
import TitlePaper from "../../components/title-paper";
import { SPSVRound, tallySPSVWithRounds } from "./spsv";
import { VoteAndBallots } from "./types";

/**
 * Renders an SPSV round name.
 * @param round An SPSV round.
 */
function renderRoundName(round: SPSVRound): ReactNode {
    switch (round.kind.type) {
        case "initial":
            return `Round ${round.kind.seatIndex + 1}`;
        case "replacement":
            // TODO: render original candidate's name better.
            // (IDs are ugly)
            return `Replacement for ${round.kind.resignerId}`;
    }
}

function visualizeCandidate(candidateId: string, round: SPSVRound): JSX.Element {
    let data = round.candidates.find(x => x.option.id === candidateId);
    if (!data) {
        throw new Error(`Cannot find candidate ${candidateId}.`);
    }

    return <TitlePaper title={data.option.name}>
    </TitlePaper>;
}

/**
 * Visualizes a single SPSV round.
 * @param round The round to visualize.
 */
function visualizeRound(round: SPSVRound): JSX.Element {
    return <div>
        <Typography variant="h2">{renderRoundName(round)}</Typography>
        {visualizeCandidate(round.roundWinner, round)}
        {round.unelectedCandidates.map(x => visualizeCandidate(x, round))}
    </div>;
}

/**
 * Visually tallies a set of ballots according to the rules of SPSV.
 * @param voteAndBallots The set of ballots to tally.
 * @param seats The number of seats in the vote.
 */
export function visuallyTallySPSV(voteAndBallots: VoteAndBallots, seats?: number): JSX.Element[] {
    let rounds = tallySPSVWithRounds(voteAndBallots, seats);
    return rounds.map(visualizeRound);
}
