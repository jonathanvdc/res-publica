import React, { PureComponent } from "react";
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton } from "@material-ui/core";
import DeleteIcon from '@material-ui/icons/Delete';
import './reddit-auth-page.css';

type Props = {
    registeredVoters: string[];
    addRegisteredVoter?: (name: string) => void;
    removeRegisteredVoter?: (name: string) => void;
};

/**
 * A list that shows all registered voters. It may also allow users to add or
 * remove registered voters.
 */
class RegisteredVoterList extends PureComponent<Props> {
    render() {
        return <List dense>
            {this.props.registeredVoters.sort().map((value) =>
                <ListItem key={value} button>
                    {/* <ListItemAvatar>
                        <Avatar
                        alt={`Avatar n°${value + 1}`}
                        src={`/static/images/avatar/${value + 1}.jpg`}
                        />
                    </ListItemAvatar> */}
                    <ListItemText primary={`u/${value}`} />
                    {this.props.removeRegisteredVoter && <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="delete">
                            <DeleteIcon />
                        </IconButton>
                    </ListItemSecondaryAction>}
                </ListItem>
            )}
        </List>;
    }
}

export default RegisteredVoterList;
