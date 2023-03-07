import { tallySainteLague } from "./sainte-lague";
import { VoteAndBallots } from "./types";

test('Sainte-Lague allocates all seats to perfect winner', () => {
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
                "positions": 4,
                "tally": "sainte-lague"
            },
            "resigned": []
        },
        "ballots": [
            {
                "selectedOptionId": "monkey",
                "id": "a",
                "timestamp": 1599241787.8502607
            }
        ]
    };

    expect(tallySainteLague(voteAndBallots)).toEqual([{ optionId: "monkey", seats: 4 }, { optionId: "cow", seats: 0 }, { optionId: "sheep", seats: 0 }]);
});

test('Sainte-Lague allocates proportionately', () => {
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
                "positions": 4,
                "tally": "sainte-lague"
            },
            "resigned": []
        },
        "ballots": [
            {
                "selectedOptionId": "monkey",
                "id": "a",
                "timestamp": 1599241787.8502607
            },
            {
                "selectedOptionId": "monkey",
                "id": "b",
                "timestamp": 1599241787.8502607
            },
            {
                "selectedOptionId": "sheep",
                "id": "c",
                "timestamp": 1599241787.8502607
            },
            {
                "selectedOptionId": "cow",
                "id": "d",
                "timestamp": 1599241787.8502607
            }
        ]
    };

    expect(tallySainteLague(voteAndBallots)).toEqual([{ optionId: "monkey", seats: 2 }, { optionId: "cow", seats: 1 }, { optionId: "sheep", seats: 1 }]);
});
