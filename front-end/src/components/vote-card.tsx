import React, { PureComponent } from "react";
import { VoteAndBallots } from "../model/vote";
import ReactMarkdown from "react-markdown";
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

type Props = {
    voteAndBallots: VoteAndBallots;
};

/**
 * A card that allows users to inspect and interact with a vote.
 */
class VoteCard extends PureComponent<Props> {
    render() {
        let vote = this.props.voteAndBallots.vote;
        let options: JSX.Element[] = [];
        for (let option of vote.options) {
            options.push(<div className="VoteOptionPanel">
                <h3 className="VoteOption">{option.name}</h3>
                <ReactMarkdown
                    className="VoteOptionDescription"
                    source={option.description}
                    escapeHtml={false}
                    unwrapDisallowed={true}/>
            </div>);
        }

        return <ExpansionPanel className="VoteCardPanel">
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{vote.name}</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <div>
                    <ReactMarkdown
                        className="VoteDescription"
                        source={vote.description}
                        escapeHtml={false}
                        unwrapDisallowed={true} />
                    {options}
                </div>
            </ExpansionPanelDetails>
        </ExpansionPanel>;
    }
}

export default VoteCard;
