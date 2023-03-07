import React, { Component } from "react";
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, ListItemIcon, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField } from "@mui/material";
import PlusIcon from '@mui/icons-material/PlusOne';
import DeleteIcon from '@mui/icons-material/Delete';
import { sortBy } from "../model/util";

type Props = {
    registeredVoters: string[];
    addRegisteredVoter?: (name: string) => void;
    removeRegisteredVoter?: (name: string) => void;
};

type State = {
    addVoterDialogOpen: true;
    voterName: string;
} | {
    addVoterDialogOpen: false;
    voterName?: string;
};

/**
 * A list that shows all registered voters. It may also allow users to add or
 * remove registered voters.
 */
class RegisteredVoterList extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { addVoterDialogOpen: false };
    }

    onOpenAddVoterDialog() {
        this.setState({
            addVoterDialogOpen: true,
            voterName: ""
        });
    }

    onAddVoter() {
        if (this.state.addVoterDialogOpen) {
            let voterName = this.state.voterName;
            this.setState({ ...this.state, addVoterDialogOpen: false });
            this.props.addRegisteredVoter!(voterName);
        }
    }

    onUpdateNewVoterName(event: React.ChangeEvent<HTMLInputElement>) {
        let voterName = event.target.value;
        if (voterName.startsWith("u/")) {
            voterName = voterName.substring("u/".length);
        }
        this.setState({
            addVoterDialogOpen: this.state.addVoterDialogOpen,
            voterName
        });
    }

    onCloseAddVoterDialog() {
        this.setState({ addVoterDialogOpen: false });
    }

    redirectToVoterHomepage(voterId: string) {
        window.location.href = `https://reddit.com/u/${voterId}`;
    }

    render() {
        return <React.Fragment>
            <List dense>
                {sortBy(this.props.registeredVoters, x => x.toLowerCase()).map((value) =>
                    <ListItem button key={`u/${value}`} onClick={() => this.redirectToVoterHomepage(value)}>
                        <ListItemText primary={`u/${value}`} />
                        {this.props.removeRegisteredVoter && <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="delete" onClick={() => this.props.removeRegisteredVoter!(value)}>
                                <DeleteIcon />
                            </IconButton>
                        </ListItemSecondaryAction>}
                    </ListItem>
                )}
                {this.props.addRegisteredVoter &&
                    <ListItem key="add" button onClick={this.onOpenAddVoterDialog.bind(this)}>
                        <ListItemIcon>
                            <PlusIcon />
                        </ListItemIcon>
                        <ListItemText primary="Register New Voter" />
                    </ListItem>}
            </List>
            <Dialog
                open={this.state.addVoterDialogOpen}
                onClose={this.onCloseAddVoterDialog.bind(this)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description">
                <DialogTitle id="alert-dialog-title">Register New Voter</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Please input the username of the voter you would like to register.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Username"
                        fullWidth
                        value={`u/${this.state.voterName}`}
                        onChange={this.onUpdateNewVoterName.bind(this)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onCloseAddVoterDialog.bind(this)}>Cancel</Button>
                    <Button onClick={this.onAddVoter.bind(this)} disabled={!this.state.voterName} color="primary" autoFocus>Add</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>;
    }
}

export default RegisteredVoterList;
