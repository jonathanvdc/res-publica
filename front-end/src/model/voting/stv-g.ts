import { RankedChoiceBallot, RankedChoiceBallotType, VoteAndBallots, VoteOption } from "./types";
import { getFirstRemainingChoice } from "./stv";

function electCandidate(ballots: RankedChoiceBallot[], quota: number, ineligible: string[], options: VoteOption[]): { elected: string, usedBallots: RankedChoiceBallot[], remainingBallots: RankedChoiceBallot[] } | { eliminated: string } {
    const candidateScores = new Map<string, number>();
    for (let ballot of ballots) {
        const firstChoice = getFirstRemainingChoice(ballot, ineligible);
        if (firstChoice) {
            candidateScores.set(firstChoice, (ballot.weight || 1) + (candidateScores.get(firstChoice) || 0));
        }
    }

    /// Add candidates with no first remaining choice
    ///     to avoid emininating first pick
    ///     (Hopefully won't be needed)
    options.forEach(x => {
        if ( !ineligible.includes(x.id) && !candidateScores.has(x.id) )
            candidateScores.set(x.id, 0);
    });

    const sortedCandidates = Array.from(candidateScores.entries())
        .sort((a, b) => b[1] - a[1]);
    
    if (quota === ballots.length /// Deal with edge case when ballots and quota are equal
        ? sortedCandidates[0][1] >= quota 
        : sortedCandidates[0][1] > quota) {
        let elected = sortedCandidates[0][0];
        const usedBallots: RankedChoiceBallot[] = [];
        const remainingBallots: RankedChoiceBallot[] = [];
        let reweight = (sortedCandidates[0][1] - quota) / sortedCandidates[0][1];
        for (let ballot of ballots) {
            if (getFirstRemainingChoice(ballot, ineligible) === elected) {
                /// Push the old ballot as a used ballot and push a 
                ///     new, reweighted ballot to the remaining ballots
                usedBallots.push(ballot);
                let newBallot = Object.assign({}, ballot);
                newBallot.weight = (newBallot.weight || 1) * reweight;
                remainingBallots.push(newBallot);
            } else {
                remainingBallots.push(ballot);
            }
        }
        return { elected, remainingBallots, usedBallots };
    } else {
        // No candidate exceeded the quota. Eliminate a candidate instead.
        return { eliminated: sortedCandidates[sortedCandidates.length - 1][0] };
    }
}

export function tallySTVG(voteAndBallots: VoteAndBallots, seats?: number): string[] {
    let ballotType = voteAndBallots.vote.type as RankedChoiceBallotType;
    let adjustedSeats = Math.min(seats || ballotType.positions, voteAndBallots.vote.options.length);

    // Compute the Droop quota.
    let quota = Math.floor(voteAndBallots.ballots.length / (adjustedSeats + 1)) + 1;

    // Now run as many rounds as we have seats. We elect one candidate per round.
    let ballots = voteAndBallots.ballots as RankedChoiceBallot[];

    let ineligible: string[] = [];
    let results: string[] = [];
    const used = new Map<string, RankedChoiceBallot[]>();

    function fillSeats() {
        while (results.length < adjustedSeats && ineligible.length < voteAndBallots.vote.options.length) {
            if (ineligible.length === voteAndBallots.vote.options.length - (adjustedSeats - results.length)) {
                // If we're down to the last eligible candidates, just choose those candidates indiscriminately.
                // eslint-disable-next-line
                let winners = voteAndBallots.vote.options.filter(x => !ineligible.includes(x.id)).map(y => y.id);
                // eslint-disable-next-line
                winners.forEach(winner => 
                { 
                    results.push(winner)
                    used.set(winner, ballots.filter(ballot => getFirstRemainingChoice(ballot, ineligible)))
                });
                // eslint-disable-next-line
                winners.forEach(winner => ineligible.push(winner));
                ballots = [];
            }
            else {
                // Otherwise, either make a candidate win or eliminate a candidate.
                let roundResult = electCandidate(ballots, quota, ineligible, voteAndBallots.vote.options);
                if ('eliminated' in roundResult) {
                    ineligible.push(roundResult.eliminated);
                } else {
                    results.push(roundResult.elected);
                    ineligible.push(roundResult.elected);
                    used.set(roundResult.elected, roundResult.usedBallots);
                    ballots = roundResult.remainingBallots;
                }
            }
        }
    }

    fillSeats();

    // For each candidate that resigns, we appoint a replacement by adding their ballots back to
    // the pot and re-running the algorithm with the remaining candidates.
    // (I have no idea if this new version works or not)
    const alreadyResigned: string[] = [];
    for (let resignation of voteAndBallots.vote.resigned || []) {
        alreadyResigned.push(resignation);
        results = results.filter(x => x !== resignation);
        ineligible = [...results, ...alreadyResigned];
        ballots.filter(x => !(used.get(resignation) || []).includes(x));
        ballots.push(...used.get(resignation) || []);
        fillSeats();
    }

    return results;
}