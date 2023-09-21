import { tallySTVG } from "./stv-g";
import { VoteAndBallots } from "./types";

test('STV elects clearest winner', () => {
    let voteAndBallots: VoteAndBallots = {
        "vote": {
            "deadline": 1599244140,
            "description": "A vote on something.",
            "id": "41st-presidential-election",
            "name": "41st Presidential Election",
            "options": [
                {
                    "description": "",
                    "id": "cow",
                    "name": "cow"
                },
                {
                    "description": "",
                    "id": "sheep",
                    "name": "sheep"
                },
                {
                    "description": "monke",
                    "id": "monkey",
                    "name": "monkey"
                }
            ],
            "type": {
                "positions": 1,
                "tally": "stv-g"
            },
            "resigned": []
        },
        "ballots": [
            {
                "optionRanking": [ "monkey", "sheep", "cow" ],
                "id": "a",
                "timestamp": 1599241787.8502607
            }
        ]
    };

    expect(tallySTVG(voteAndBallots)).toEqual(["monkey"]);
});

test('STV elects clear winner', () => {
    let voteAndBallots: VoteAndBallots = {
        "vote": {
            "deadline": 1599244140,
            "description": "A vote on something.",
            "id": "41st-presidential-election",
            "name": "41st Presidential Election",
            "options": [
                {
                    "description": "",
                    "id": "cow",
                    "name": "cow"
                },
                {
                    "description": "",
                    "id": "sheep",
                    "name": "sheep"
                },
                {
                    "description": "monke",
                    "id": "monkey",
                    "name": "monkey"
                }
            ],
            "type": {
                "positions": 1,
                "tally": "stv-g"
            },
            "resigned": []
        },
        "ballots": [
            {
                "optionRanking": [ "monkey", "sheep", "cow" ],
                "id": "a",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "monkey", "sheep", "cow" ],
                "id": "b",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "monkey", "sheep", "cow" ],
                "id": "c",
                "timestamp": 1599241787.8502607
            }
        ]
    };

    expect(tallySTVG(voteAndBallots)).toEqual(["monkey"]);
});


test('STV eliminates least popular candidate', () => {
    let voteAndBallots: VoteAndBallots = {
        "vote": {
            "deadline": 1599244140,
            "description": "A vote on something.",
            "id": "41st-presidential-election",
            "name": "41st Presidential Election",
            "options": [
                {
                    "description": "",
                    "id": "cow",
                    "name": "cow"
                },
                {
                    "description": "",
                    "id": "sheep",
                    "name": "sheep"
                },
                {
                    "description": "monke",
                    "id": "monkey",
                    "name": "monkey"
                }
            ],
            "type": {
                "positions": 1,
                "tally": "stv-g"
            },
            "resigned": []
        },
        "ballots": [
            {
                "optionRanking": [ "monkey", "sheep", "cow" ],
                "id": "a",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "sheep", "monkey", "cow" ],
                "id": "b",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "cow", "sheep", "monkey" ],
                "id": "c",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "sheep", "monkey", "cow" ],
                "id": "d",
                "timestamp": 1599241787.8502607
            }
        ]
    };

    expect(tallySTVG(voteAndBallots)).toEqual(["sheep"]);
});

test('STV elects most popular candidates', () => {
    let voteAndBallots: VoteAndBallots = {
        "vote": {
            "deadline": 1599244140,
            "description": "A vote on something.",
            "id": "41st-presidential-election",
            "name": "41st Presidential Election",
            "options": [
                {
                    "description": "",
                    "id": "cow",
                    "name": "cow"
                },
                {
                    "description": "",
                    "id": "sheep",
                    "name": "sheep"
                },
                {
                    "description": "monke",
                    "id": "monkey",
                    "name": "monkey"
                }
            ],
            "type": {
                "positions": 2,
                "tally": "stv-g"
            },
            "resigned": []
        },
        "ballots": [
            {
                "optionRanking": [ "monkey", "sheep", "cow" ],
                "id": "a",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "sheep", "monkey", "cow" ],
                "id": "b",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "cow", "sheep", "monkey" ],
                "id": "c",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "sheep", "monkey", "cow" ],
                "id": "d",
                "timestamp": 1599241787.8502607
            }
        ]
    };

    expect(tallySTVG(voteAndBallots)).toEqual(["sheep", "monkey"]);
});

test('STV appoints replacement', () => {
    let voteAndBallots: VoteAndBallots = {
        "vote": {
            "deadline": 1599244140,
            "description": "A vote on something.",
            "id": "41st-presidential-election",
            "name": "41st Presidential Election",
            "options": [
                {
                    "description": "",
                    "id": "cow",
                    "name": "cow"
                },
                {
                    "description": "",
                    "id": "sheep",
                    "name": "sheep"
                },
                {
                    "description": "monke",
                    "id": "monkey",
                    "name": "monkey"
                }
            ],
            "type": {
                "positions": 1,
                "tally": "stv-g"
            },
            "resigned": [
                "sheep"
            ]
        },
        "ballots": [
            {
                "optionRanking": [ "monkey", "sheep", "cow" ],
                "id": "a",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "sheep", "monkey", "cow" ],
                "id": "b",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "cow", "sheep", "monkey" ],
                "id": "c",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "sheep", "monkey", "cow" ],
                "id": "d",
                "timestamp": 1599241787.8502607
            }
        ]
    };

    expect(tallySTVG(voteAndBallots)).toEqual(["monkey"]);
});

test('STV appoints replacement 2', () => {
    let voteAndBallots: VoteAndBallots = {
        "vote": {
            "deadline": 1599244140,
            "description": "A vote on something.",
            "id": "41st-presidential-election",
            "name": "41st Presidential Election",
            "options": [
                {
                    "description": "",
                    "id": "cow",
                    "name": "cow"
                },
                {
                    "description": "",
                    "id": "sheep",
                    "name": "sheep"
                },
                {
                    "description": "monke",
                    "id": "monkey",
                    "name": "monkey"
                }
            ],
            "type": {
                "positions": 3,
                "tally": "stv-g"
            },
            "resigned": [
                "sheep",
                "monkey"
            ]
        },
        "ballots": [
            {
                "optionRanking": [ "monkey", "sheep", "cow" ],
                "id": "a",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "sheep", "monkey", "cow" ],
                "id": "b",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "cow", "sheep", "monkey" ],
                "id": "c",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "sheep", "monkey", "cow" ],
                "id": "d",
                "timestamp": 1599241787.8502607
            }
        ]
    };

    expect(tallySTVG(voteAndBallots)).toEqual(["cow"]);
});

test('STV-G reweights and has correct amount of winners', () => {
    let voteAndBallots: VoteAndBallots = {
        "vote": {
            "deadline": 1599244140,
            "description": "A vote on something.",
            "id": "41st-presidential-election",
            "name": "41st Presidential Election",
            "options": [
                {
                    "description": "",
                    "id": "cow",
                    "name": "cow"
                },
                {
                    "description": "",
                    "id": "sheep",
                    "name": "sheep"
                },
                {
                    "description": "monke",
                    "id": "monkey",
                    "name": "monkey"
                },
                {
                    "description": "",
                    "id": "pig",
                    "name": "pig"
                },
                {
                    "description": "",
                    "id": "dog",
                    "name": "dog"
                },
                {
                    "description": "monke",
                    "id": "cat",
                    "name": "cat"
                }
            ],
            "type": {
                "positions": 3,
                "tally": "stv-g"
            },
            "resigned": []
        },
        "ballots": [
            {
                "optionRanking": [ "monkey", "sheep", "pig", "dog", "cat", "cow" ],
                "id": "a",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "monkey", "sheep", "pig", "dog", "cat", "cow" ],
                "id": "b",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "cow", "sheep", "monkey", "pig", "dog", "cat" ],
                "id": "c",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "cow", "cat", "sheep", "monkey", "pig", "dog" ],
                "id": "d",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "dog", "cat", "cow", "sheep", "monkey", "pig" ],
                "id": "e",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "dog", "pig", "cat", "cow", "sheep", "monkey" ],
                "id": "f",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "dog", "pig", "cat", "cow", "sheep", "monkey" ],
                "id": "g",
                "timestamp": 1599241787.8502607
            }
        ]
    };

    expect(tallySTVG(voteAndBallots)).toEqual(["dog", "cow", "monkey"]);
});

test('STV ballots dont not have full list', () => {
    let voteAndBallots: VoteAndBallots = {
        "vote": {
            "deadline": 1599244140,
            "description": "A vote on something.",
            "id": "41st-presidential-election",
            "name": "41st Presidential Election",
            "options": [
                {
                    "description": "",
                    "id": "cow",
                    "name": "cow"
                },
                {
                    "description": "",
                    "id": "sheep",
                    "name": "sheep"
                },
                {
                    "description": "monke",
                    "id": "monkey",
                    "name": "monkey"
                },
                {
                    "description": "",
                    "id": "pig",
                    "name": "pig"
                },
                {
                    "description": "",
                    "id": "dog",
                    "name": "dog"
                },
                {
                    "description": "monke",
                    "id": "cat",
                    "name": "cat"
                }
            ],
            "type": {
                "positions": 3,
                "tally": "stv-g"
            },
            "resigned": []
        },
        "ballots": [
            {
                "optionRanking": [ "monkey" ],
                "id": "a",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "monkey", "sheep", "pig", "dog" ],
                "id": "b",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "pig", "dog", "cat" ],
                "id": "c",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "cow", "cat", "sheep", "monkey" ],
                "id": "d",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "dog", "cat", "cow", "sheep", "monkey", "pig" ],
                "id": "e",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "dog" ],
                "id": "f",
                "timestamp": 1599241787.8502607
            },
            {
                "optionRanking": [ "dog", "pig", "cat", "cow", "sheep" ],
                "id": "g",
                "timestamp": 1599241787.8502607
            }
        ]
    };

    expect(tallySTVG(voteAndBallots)).toEqual(["dog", "monkey", "pig"]);
});


