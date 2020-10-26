import { PureComponent } from "react";

type Props = {
    rounds: JSX.Element[];
};

class VisualizeTallyPage extends PureComponent<Props> {
    render() {
        // TODO: allow user to navigate rounds.
        return this.props.rounds[0];
    }
};

export default VisualizeTallyPage;
