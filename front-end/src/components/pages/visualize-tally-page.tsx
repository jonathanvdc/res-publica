import { Button } from "@material-ui/core";
import React, { Component } from "react";

type Props = {
    rounds: JSX.Element[];
};

type State = {
    currentRound: number;
};

class VisualizeTallyPage extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { currentRound: 0 };
    }

    navigate(delta: number) {
        this.setState({
            currentRound: this.state.currentRound + delta
        });
    }

    renderNavButtons() {
        return <div style={{display: "flex", width: "100%", margin: "2em"}}>
            {this.state.currentRound > 0 &&
                <Button variant="contained" onClick={() => this.navigate(-1)}>Previous</Button>}
            <div style={{flexGrow: 1}} />
            {this.state.currentRound < this.props.rounds.length - 1 &&
                <Button variant="contained" onClick={() => this.navigate(1)}>Next</Button>}
        </div>;
    }

    render() {
        return <React.Fragment>
            {this.renderNavButtons()}
            {this.props.rounds[this.state.currentRound]}
            {this.renderNavButtons()}
        </React.Fragment>;
    }
};

export default VisualizeTallyPage;
