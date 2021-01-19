import React from "react";
import { Typography } from "@material-ui/core";
import { getPreferences } from "../../../model/preferences";
import { ChooseOneBallot, tally, tallyOrder, VoteAndBallots, VoteOption } from "../../../model/vote";
import { renderCollapsibleMarkdown } from "../../widgets/collapsible-markdown";
import { renderCandidateName } from "../candidate-name";
import CandidatePanel from "../candidate-panel";
import ElectionCard from "./election-card";

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
    winners: string[];

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

    renderScore(option: VoteOption): React.ReactNode {
        let ballots = this.props.voteAndBallots.ballots;
        if (ballots.length === 0) {
            return undefined;
        }

        let vote = this.props.voteAndBallots.vote;
        switch (vote.type.tally) {
            case "first-past-the-post":
                let votePercentage = ballots.filter(x => (x as ChooseOneBallot).selectedOptionId === option.id).length / ballots.length;
                return `${Math.round(100 * votePercentage)}%`;
            case "spsv":
            case "star":
                let rankingIndex = this.state.ranking.indexOf(option.id);
                return `#${rankingIndex + 1}`;
        }
    }

    renderOption(option: VoteOption): React.ReactNode {
        let isWinner = this.state.winners.includes(option.id);
        let hasResigned = !!this.props.voteAndBallots.vote.resigned?.includes(option.id);

        return <CandidatePanel isWinner={isWinner} hasResigned={hasResigned} score={this.renderScore(option)}>
            <Typography className="VoteOption" variant="h4">{renderCandidateName(option)}</Typography>
            {renderCollapsibleMarkdown(option.description, "VoteOptionDescription", true, this.state.collapseDescriptionsByDefault)}
        </CandidatePanel>;
    }
}

export default HistoricalElectionCard;
