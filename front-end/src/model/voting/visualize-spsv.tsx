import React, { ReactNode } from "react";
import { Typography } from "@material-ui/core";
import { getBallotWeight, getCandidateScore, KotzePereiraBallot, SPSVCandidate, SPSVRound, tallySPSVWithRounds } from "./spsv";
import { RateOptionsBallot, VoteAndBallots } from "./types";
import Ticket from "../../components/election/ticket";
import CandidatePanel from "../../components/election/candidate-panel";
import BallotDots from "../../components/election/ballot-dots";
import { sortBy } from "../util";

function idToCandidate(candidateId: string, round: SPSVRound): SPSVCandidate {
    let data = round.candidates.find(x => x.option.id === candidateId);
    if (!data) {
        throw new Error(`Cannot find candidate ${candidateId}.`);
    }
    return data;
}

function renderCandidateName(candidate: SPSVCandidate): ReactNode {
    if (candidate.option.ticket) {
        return <Ticket candidates={candidate.option.ticket} />;
    } else {
        return candidate.option.name;
    }
}

/**
 * Renders an SPSV round name.
 * @param round An SPSV round.
 */
function renderRoundName(round: SPSVRound): ReactNode {
    switch (round.kind.type) {
        case "initial":
            return `Round ${round.kind.seatIndex + 1}`;
        case "replacement":
            let option = idToCandidate(round.kind.resignerId, round);
            return <span>Replacement for {renderCandidateName(option)}</span>;
    }
}

function visualizeCandidate(candidateId: string, round: SPSVRound): JSX.Element {
    let data = round.candidates.find(x => x.option.id === candidateId);
    if (!data) {
        throw new Error(`Cannot find candidate ${candidateId}.`);
    }

    let ballots = new Map<RateOptionsBallot, KotzePereiraBallot[]>();
    for (let item of data.approvingBallots) {
        let elems = ballots.get(item.originalBallot);
        if (elems) {
            elems.push(item);
        } else {
            elems = [item];
        }
        ballots.set(item.originalBallot, sortBy(elems, b => b.score, true));
    }

    return <CandidatePanel isWinner={candidateId === round.roundWinner}>
        <Typography variant="h4">{renderCandidateName(data)}</Typography>
        Score: {getCandidateScore(data, round)}
        <div>
            {Array.of(...ballots.values()).map(x => <BallotDots dotWeights={x.map(y => getBallotWeight(y, round))} />)}
        </div>
    </CandidatePanel>;
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
