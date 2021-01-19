import React, { Component } from "react";
import { VoteAndBallots, VoteOption } from "../../../model/vote";
import './election-card.css';

type Props = {
    voteAndBallots: VoteAndBallots;
};

type State = {
    /**
     * A ranking of vote options.
     */
    ranking: string[]
};

/**
 * A widget that allows users to inspect or interact with an election.
 */
abstract class ElectionCard<TProps extends Props, TState extends State>
    extends Component<TProps, TState> {

    constructor(props: TProps) {
        super(props);
    }

    /**
     * Builds an initial state.
     */
    buildInitialState(): State {
        return {
            ranking: this.orderCandidates(this.props.voteAndBallots)
        };
    }

    /**
     * Creates the election's header. This includes the vote's title and could also
     * include a timer or configuration options.
     */
    abstract createHeader(): React.ReactNode;

    /**
     * Orders an election's candidates.
     */
    abstract orderCandidates(election: VoteAndBallots): string[];

    /**
     * Renders an option in an election.
     */
    abstract renderOption(option: VoteOption): React.ReactNode;

    /**
     * Gets the current ranking of candidates.
     */
    getRankedCandidates(): string[] {
        return this.state.ranking;
    }

    render() {
        let vote = this.props.voteAndBallots.vote;

        let options: React.ReactNode[] = [];
        for (let optionId of this.getRankedCandidates()) {
            let option = vote.options.find(({ id }) => id === optionId);
            if (!option) {
                throw new Error(`Option with id ${optionId} was expected to but did not appear on ballot options.`);
            }

            options.push(this.renderOption(option));
        }

        return <div className="VoteContainer">
            <div className="CandidatePanelContents">
                {this.createHeader()}
            </div>
            {options}
        </div>;
    }
}

export default ElectionCard;
