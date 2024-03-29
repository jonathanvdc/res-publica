import React, { ReactNode } from "react";
import { Typography } from "@mui/material";
import { getBallotWeight, getCandidateScore, getCandidateScores, KotzePereiraBallot, SPSVCandidate, SPSVRound, tallySPSVWithRounds } from "./spsv";
import { RateOptionsBallot, VoteAndBallots } from "./types";
import CandidatePanel from "../../components/election/candidate-panel";
import BallotDots from "../../components/election/ballot-dots";
import { sortBy } from "../util";
import RateOptionsBallotSummary from "../../components/election/rate-options-ballot-summary";
import { renderCandidateName } from "../../components/election/candidate-name";
import CandidateImpactTable, { CandidateImpact } from "../../components/election/candidate-impact-table";
import BallotDotsPanel from "../../components/election/ballot-dots-panel";

function idToCandidate(candidateId: string, round: SPSVRound): SPSVCandidate {
    let data = round.candidates.find(x => x.option.id === candidateId);
    if (!data) {
        throw new Error(`Cannot find candidate ${candidateId}.`);
    }
    return data;
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
            return <span>Replacement for {renderCandidateName(option.option)}</span>;
    }
}

function visualizeBallot(ballot: RateOptionsBallot, virtualBallots: KotzePereiraBallot[], round: SPSVRound): ReactNode {
    let weights = virtualBallots.map(y => getBallotWeight(y, round));
    let totalWeight = weights.reduce((previous, current) => previous + current, 0);
    return <BallotDots
        dotWeights={weights}
        hoverCard={<RateOptionsBallotSummary
            ballot={ballot}
            vote={round.vote}
            description={`Weighted score: ${totalWeight.toFixed(2)}`}
            electedCandidates={round.electedCandidates} />} />;
}

/**
 * Computes the effect of each previously-elected candidate on each currently-eligible
 * candidate in a round.
 * @param round The round to examine.
 */
function computeCandidateImpacts(round: SPSVRound): Map<string, CandidateImpact[]> {
    let candidateScores = new Map<string, number[]>();
    let totalScores: number[] = [0];

    // First compute initial vote shares.
    let initialRound: SPSVRound = {
        ...round,
        electedCandidates: []
    };
    for (let [k, v] of getCandidateScores(initialRound).entries()) {
        candidateScores.set(k, [v]);
        totalScores[0] += v;
    }

    // Then run the rounds, see how pre-elected candidates change the
    // other candidates' scores.
    for (let i = 0; i < round.electedCandidates.length; i++) {
        let roundN: SPSVRound = {
            ...round,
            electedCandidates: round.electedCandidates.slice(0, i + 1)
        };
        totalScores.push(0);
        for (let [k, v] of getCandidateScores(roundN).entries()) {
            candidateScores.get(k)!.push(v);
            totalScores[i + 1] += v;
        }
    }

    // Now repackage the data.
    let impacts = new Map<string, CandidateImpact[]>();
    for (let [affectedCandidateId, v] of candidateScores.entries()) {
        let impactList: CandidateImpact[] = [];
        for (let i = 0; i < v.length - 1; i++) {
            impactList.push({
                electedCandidate: idToCandidate(round.electedCandidates[i], round).option,
                scoreBefore: v[i],
                scoreAfter: v[i + 1],
                totalScoreBefore: totalScores[i],
                totalScoreAfter: totalScores[i + 1]
            });
        }
        impacts.set(affectedCandidateId, impactList);
    }

    return impacts;
}

function visualizeCandidate(candidateId: string, round: SPSVRound, impacts: CandidateImpact[]): JSX.Element {
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
        <Typography variant="h4">{renderCandidateName(data.option)}</Typography>
        Score: {getCandidateScore(data, round).toFixed(2)}
        <BallotDotsPanel>
            {Array.of(...ballots.entries()).map(([x, y]) => visualizeBallot(x, y, round))}
        </BallotDotsPanel>
        {impacts.length > 0 &&
            <React.Fragment>
                <hr/>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
                    <Typography variant="caption">Explore how previous candidates affected the score.</Typography>
                    <CandidateImpactTable impacts={impacts} />
                </div>
            </React.Fragment>}
    </CandidatePanel>;
}

/**
 * Visualizes a single SPSV round.
 * @param round The round to visualize.
 */
function visualizeRound(round: SPSVRound): JSX.Element {
    let impacts = computeCandidateImpacts(round);
    return <div>
        <Typography variant="h2">{renderRoundName(round)}</Typography>
        {visualizeCandidate(round.roundWinner, round, impacts.get(round.roundWinner) || [])}
        {round.unelectedCandidates.map(x => visualizeCandidate(x, round, impacts.get(x) || []))}
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
