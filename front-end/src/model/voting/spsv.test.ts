import { tallySPSVWithRounds } from "./spsv";
import { VoteAndBallots } from "./types";

test('SPSV stops replacing when it runs out of candidates', () => {
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
                "max": 5,
                "min": 0,
                "positions": 7,
                "tally": "spsv"
            },
            "resigned": [
                "cow"
            ]
        },
        "ballots": [
            {
                "ratingPerOption": [
                    {
                        "optionId": "cow",
                        "rating": 1
                    },
                    {
                        "optionId": "sheep",
                        "rating": 4
                    },
                    {
                        "optionId": "monkey",
                        "rating": 3
                    }
                ],
                "id": "8339221cd2e16c89306aba37b6cbe32e82cc88ed249fac0226a8bd3ddfb688fc",
                "timestamp": 1599241787.8502607
            }
        ]
    };

    for (let round of tallySPSVWithRounds(voteAndBallots)) {
        expect(round.roundWinner).toBeDefined();
    }
});
