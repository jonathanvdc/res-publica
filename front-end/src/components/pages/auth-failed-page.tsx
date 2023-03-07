import React, { PureComponent } from "react";
import { Typography, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import CrossIcon from '@mui/icons-material/Close';

type SymbolicOperand = "redditor.age" | "redditor.total_karma";

type VoterRequirement = {
    operator: ">=" | "<=" | "<" | ">" | "==" | "!=";
    lhs: SymbolicOperand | number;
    rhs: SymbolicOperand | number;
};

function renderSymbolicOperand(operand: SymbolicOperand) {
    switch (operand) {
        case "redditor.age":
            return "Reddit age in days";
        case "redditor.total_karma":
            return "Reddit karma";
        default:
            return operand;
    }
}

function renderOperand(operand: SymbolicOperand | number) {
    if (typeof operand === "number") {
        return operand.toString();
    } else {
        return renderSymbolicOperand(operand);
    }
}

function renderRequirement([requirement, matched]: [VoterRequirement, boolean]) {
    return <ListItem>
        <ListItemIcon>{matched ? <CheckIcon color="secondary" /> : <CrossIcon color="error" />}</ListItemIcon>
        <ListItemText>
            {renderOperand(requirement.lhs)} {requirement.operator} {renderOperand(requirement.rhs)}
        </ListItemText>
    </ListItem>;
}

type Props = {
    error: string;
    requirements?: [VoterRequirement, boolean][];
};

/**
 * A page that shows up when authentication fails.
 */
class AuthFailedPage extends PureComponent<Props> {
    render() {
        if (this.props.error === "requirements-not-met" && this.props.requirements) {
            return <div>
                <Typography variant="h2">Sorry!</Typography>
                <Typography>
                    It looks like you're not eligible to vote. These are the requirements
                    and here's how they apply to you.
                </Typography>
                <List>
                    {this.props.requirements.map(x => renderRequirement(x))}
                </List>
            </div>;
        } else {
            return <div>
                <Typography variant="h2">Aw snap!</Typography>
                <Typography>
                    We couldn't sign you in. We got this error code: {this.props.error}.
                    Try again and contact us if that doesn't work.
                </Typography>
            </div>;
        }
    }
}

export default AuthFailedPage;
