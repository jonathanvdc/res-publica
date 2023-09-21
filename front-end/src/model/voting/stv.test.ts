import { tallySTV } from "./stv";
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
                "tally": "stv"
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

    expect(tallySTV(voteAndBallots)).toEqual(["monkey"]);
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
                "tally": "stv"
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

    expect(tallySTV(voteAndBallots)).toEqual(["monkey"]);
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
                "tally": "stv"
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

    expect(tallySTV(voteAndBallots)).toEqual(["sheep"]);
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
                "tally": "stv"
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

    expect(tallySTV(voteAndBallots)).toEqual(["sheep", "monkey"]);
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
                "tally": "stv"
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

    expect(tallySTV(voteAndBallots)).toEqual(["monkey"]);
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
                "positions": 1,
                "tally": "stv"
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

    expect(tallySTV(voteAndBallots)).toEqual(["cow"]);
});
