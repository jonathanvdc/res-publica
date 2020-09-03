import { VoteAndBallots, VoteOption, tally } from "./vote";

function generateVoteFromBallots(ballots: number[][], tally: "star" | "spsv", seats: number): VoteAndBallots {
    let options: VoteOption[] = [];
    for (let i = 0; i < ballots[0].length; i++) {
        options.push({
            id: `option-${i}`,
            name: `Option ${i}`,
            description: `Option ${i}`
        });
    }

    return {
        vote: {
            id: 'test-vote',
            name: 'Test Vote',
            description: 'Test Vote',
            options,
            deadline: 0,
            type: {
                tally,
                positions: seats,
                min: 0,
                max: 5
            }
        },
        ballots: ballots.map(xs => ({
            ratingPerOption: xs.map((x, i) => ({ optionId: `option-${i}`, rating: x }))
        }))
    };
}

test('STAR elects most popular candidate', () => {
    let vote = generateVoteFromBallots([
        [0, 1, 2, 5],
        [0, 4, 2, 2],
    ], 'star', 1);

    expect(tally(vote)).toEqual(['option-3']);
});

test('STAR gets runoff right', () => {
    let vote = generateVoteFromBallots([
        [0, 0, 2, 4],
        [0, 5, 2, 4],
        [0, 5, 2, 4],
    ], 'star', 1);

    expect(tally(vote)).toEqual(['option-1']);
});
