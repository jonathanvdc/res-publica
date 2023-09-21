import { RankedChoiceBallot, RankedChoiceBallotType, VoteAndBallots, VoteOption } from "./types";

export function getFirstRemainingChoice(ballot: RankedChoiceBallot, ineligible: string[]): string | undefined {
    for (let id of ballot.optionRanking) {
        if (!ineligible.includes(id)) {
            return id;
        }
    }
    return undefined;
}

function electCandidate(ballots: RankedChoiceBallot[], quota: number, ineligible: string[], options: VoteOption[]): { elected: string, usedBallots: RankedChoiceBallot[], remainingBallots: RankedChoiceBallot[] } | { eliminated: string } {
    const candidateScores = new Map<string, number>();
    for (let ballot of ballots) {
        const firstChoice = getFirstRemainingChoice(ballot, ineligible);
        if (firstChoice) {
            candidateScores.set(firstChoice, 1 + (candidateScores.get(firstChoice) || 0));
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
        for (let ballot of ballots) {
            if (usedBallots.length < quota && getFirstRemainingChoice(ballot, ineligible) === elected) {
                usedBallots.push(ballot);
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

export function tallySTV(voteAndBallots: VoteAndBallots, seats?: number): string[] {
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
            if (ineligible.length === voteAndBallots.vote.options.length - 1) {
                // If we're down to the last eligible candidate, just choose that candidate indiscriminately.
                // eslint-disable-next-line
                let winner = voteAndBallots.vote.options.find(x => !ineligible.includes(x.id))!.id;
                results.push(winner);
                ineligible.push(winner);
                used.set(winner, ballots);
                ballots = [];
            } else {
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
    const alreadyResigned: string[] = [];
    for (let resignation of voteAndBallots.vote.resigned || []) {
        alreadyResigned.push(resignation);
        results = results.filter(x => x !== resignation);
        ineligible = [...results, ...alreadyResigned];
        ballots.push(...used.get(resignation) || []);
        fillSeats();
    }

    return results;
}
