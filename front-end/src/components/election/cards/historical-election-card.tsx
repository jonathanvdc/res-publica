import React from "react";
import { Typography } from "@mui/material";
import { getPreferences } from "../../../model/preferences";
import { ChooseOneBallot, tally, tallyOrder, VoteAndBallots, VoteOption } from "../../../model/vote";
import { renderCollapsibleMarkdown } from "../../widgets/collapsible-markdown";
import { renderCandidateName } from "../candidate-name";
import CandidatePanel from "../candidate-panel";
import ElectionCard from "./election-card";
import { assertUnreachable } from "../../../model/util";
import { VoteOutcome } from "../../../model/voting/types";

type Props = {
    voteAndBallots: VoteAndBallots;
};

type State = {
    /**
     * A ranking of vote options.
     */
    ranking: string[];

    /**
     * A list of winners.
     */
    winners: VoteOutcome;

    /**
     * Tells if descriptions should be collapsed by default.
     */
    collapseDescriptionsByDefault: boolean;
};

/**
 * A widget that allows users to inspect the outcome of a historical election.
 */
class HistoricalElectionCard extends ElectionCard<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = this.buildInitialState();
    }

    buildInitialState(): State {
        return {
            ...super.buildInitialState(),
            winners: tally(this.props.voteAndBallots),
            collapseDescriptionsByDefault: getPreferences().collapseDescriptionsByDefault
        };
    }

    createHeader(): React.ReactNode {
        let vote = this.props.voteAndBallots.vote;
        return <React.Fragment>
            <Typography variant="h2" className="VoteOption">{vote.name}</Typography>
            {renderCollapsibleMarkdown(vote.description, "VoteDescription", true, this.state.collapseDescriptionsByDefault)}
        </React.Fragment>;
    }

    orderCandidates(election: VoteAndBallots): string[] {
        return tallyOrder(election);
    }

    seatCount(option: VoteOption): number {
        return this.state.winners.find(({ optionId }) => optionId === option.id)?.seats || 0;
    }

    renderScore(option: VoteOption): React.ReactNode {
        let ballots = this.props.voteAndBallots.ballots;
        if (ballots.length === 0) {
            return undefined;
        }

        let vote = this.props.voteAndBallots.vote;
        let tallyingAlgo = vote.type.tally;
        switch (tallyingAlgo) {
            case "first-past-the-post":
                let votePercentage = ballots.filter(x => (x as ChooseOneBallot).selectedOptionId === option.id).length / ballots.length;
                return `${Math.round(100 * votePercentage)}%`;

            case "sainte-lague":
                return `${this.seatCount(option)} seats`;

            case "stv":
            case "spsv":
            case "star":
                let rankingIndex = this.state.ranking.indexOf(option.id);
                return `#${rankingIndex + 1}`;

            default:
                return assertUnreachable(tallyingAlgo);
        }
    }

    renderOption(option: VoteOption): React.ReactNode {
        let isWinner = this.seatCount(option) > 0;
        let hasResigned = !!this.props.voteAndBallots.vote.resigned?.includes(option.id);

        return <CandidatePanel isWinner={isWinner} hasResigned={hasResigned} score={this.renderScore(option)}>
            <Typography className="VoteOption" variant="h4">{renderCandidateName(option)}</Typography>
            {renderCollapsibleMarkdown(option.description, "VoteOptionDescription", true, this.state.collapseDescriptionsByDefault)}
        </CandidatePanel>;
    }
}

export default HistoricalElectionCard;
