import { Button, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@material-ui/core';
import React, { PureComponent } from 'react';
import { DangerButtonWithForm } from './danger-button';

type AddCandidateButtonProps = {
    onAddCandidate: (state: AddCandidateButtonFormState) => void;
};

type AddCandidateButtonFormState = {
    name: string;
    affiliation: string;
    description: string;
};

/**
 * A button that presents a screen for adding a candidate to a ballot.
 */
class AddCandidateButton extends PureComponent<AddCandidateButtonProps> {
    render() {
        let initialState = {
            name: '',
            affiliation: '',
            description: ''
        }
        return <DangerButtonWithForm<AddCandidateButtonFormState>
            initialState={initialState}
            renderDialog={(state, onUpdate, onClose) =>
                <React.Fragment>
                    <DialogTitle id="alert-dialog-title">Add new candidate</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            Please describe the candidate you would like to add to the ballot.
                        </DialogContentText>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Username"
                            fullWidth
                            value={state.name}
                            onChange={event => onUpdate({ ...state, name: event.target.value })}
                        />
                        <TextField
                            margin="dense"
                            label="Affiliation"
                            fullWidth
                            value={state.affiliation}
                            onChange={event => onUpdate({ ...state, affiliation: event.target.value })}
                        />
                        <TextField
                            margin="dense"
                            label="Description"
                            fullWidth
                            multiline
                            value={state.description}
                            onChange={event => onUpdate({ ...state, description: event.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose} color="primary">Cancel</Button>
                        <Button
                            onClick={() => { this.props.onAddCandidate(state); onClose(); }}
                            color="primary"
                            disabled={!state.name}>Add</Button>
                    </DialogActions>
                </React.Fragment>
            }>
            {this.props.children}
        </DangerButtonWithForm>;
    }
}

export default AddCandidateButton;
