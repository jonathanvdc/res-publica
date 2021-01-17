import { VoteAndBallots, VoteOption, tally, tallyOrder } from "../vote";

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

    vote = generateVoteFromBallots([
        [0, 2, 4, 0],
        [0, 2, 4, 5],
        [0, 2, 4, 5],
    ], 'star', 1);

    expect(tally(vote)).toEqual(['option-3']);
});

test('STAR breaks first round tie', () => {
    let vote = generateVoteFromBallots([
        [0, 0, 4, 4],
        [1, 3, 4, 4],
        [1, 4, 2, 4],
        [0, 5, 2, 0],
    ], 'star', 1);

    expect(tally(vote)).toEqual(['option-3']);
});

test('STAR breaks runoff tie', () => {
    let vote = generateVoteFromBallots([
        [0, 0, 2, 2],
        [0, 5, 2, 4],
        [0, 4, 2, 4],
        [0, 5, 1, 4],
        [0, 3, 1, 5],
    ], 'star', 1);

    expect(tally(vote)).toEqual(['option-3']);
});

test('STAR generates sensible replacements', () => {
    let vote = generateVoteFromBallots([
        [1, 0, 2, 5],
    ], 'star', 1);

    let [winner] = tally(vote);
    expect(winner).toEqual('option-3');
    let [replacement] = tally({ ...vote, vote: { ...vote.vote, resigned: [winner] } });
    expect(replacement).toEqual('option-2');
});


test('STAR generates consistent replacements', () => {
    let vote = generateVoteFromBallots([
        [0, 0, 2, 2],
        [0, 0, 2, 2],
        [0, 5, 2, 4],
        [0, 4, 2, 4],
        [0, 5, 1, 4],
        [0, 3, 1, 5],
        [0, 3, 1, 5],
        [0, 3, 1, 5],
        [0, 3, 1, 5],
    ], 'star', 1);

    let order = tallyOrder(vote);
    let resigned = [];

    for (let expectedWinner of order) {
        let [winner] = tally({ ...vote, vote: { ...vote.vote, resigned } });
        expect(winner).toEqual(expectedWinner);
        resigned.push(winner);
    }
});
