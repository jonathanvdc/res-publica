import { Tooltip } from "@material-ui/core";
import React, { Component, ReactNode } from "react";

type Props = {
    /**
     * The weights assigned to each of the ballot's dots.
     */
    dotWeights: number[];

    /**
     * An optional hover card to show when user hover over the ballot dots.
     */
    hoverCard?: ReactNode;
};

type State = {
    isCardOpen: boolean;
};

function toPercentage(value: number): string {
    return `${Math.round(value * 100)}%`;
}

/**
 * A representation of a ballot as a set of dots, each of which
 * representing a virtual ballot that may be weighted.
 */
class BallotDots extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { isCardOpen: false };
    }

    toggleCard(isCardOpen: boolean) {
        this.setState({
            isCardOpen
        });
    }

    render() {
        let dotsDiv = <div style={{display: "inline-block"}}>
            {this.props.dotWeights.map(w =>
                <div style={{
                    display: "inline-block",
                    width: "0.5em",
                    height: "0.5em",
                    borderRadius: "100%",
                    borderStyle: this.props.hoverCard ? "solid" : "none",
                    borderColor: this.state.isCardOpen ? "#154399" : "#159957",
                    borderWidth: this.props.hoverCard ? "2px" : "0",
                    background: `linear-gradient(to right, #159957 ${toPercentage(w - 0.01)}, #1599571e ${toPercentage(w + 0.01)})`}}/>)}
        </div>;
        if (this.props.hoverCard) {
            return <Tooltip
                open={this.state.isCardOpen}
                onClose={() => this.toggleCard(false)}
                onOpen={() => this.toggleCard(true)}
                title={this.props.hoverCard}>

                {dotsDiv}
            </Tooltip>;
        } else {
            return dotsDiv;
        }
    }
}

export default BallotDots;
