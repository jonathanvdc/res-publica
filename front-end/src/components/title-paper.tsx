import React, { PureComponent } from "react";
import { Typography, Paper } from "@material-ui/core";
import './reddit-auth-page.css';

type Props = {
    title: React.ReactNode;
    children?: React.ReactNode;
};

/**
 * A paper that presents a title and a body.
 */
class TitlePaper extends PureComponent<Props> {
    render() {
        return <Paper style={{padding: "2em"}}>
            <Typography variant="h4" style={{marginBottom: "1em"}}>{this.props.title}</Typography>
            {this.props.children}
        </Paper>;
    }
}

export default TitlePaper;
