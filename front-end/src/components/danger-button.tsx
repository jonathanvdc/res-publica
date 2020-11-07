import React, { Component, PureComponent, ReactNode } from "react";
import { Button, ButtonProps, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Theme, withStyles } from "@material-ui/core";
import { red } from "@material-ui/core/colors";

/**
 * A button that hints danger.
 */
export const DangerButton = withStyles((theme: Theme) => ({
    root: {
        color: theme.palette.getContrastText(red[600]),
        backgroundColor: red[600],
        '&:hover': {
            backgroundColor: red[700],
        },
    },
}))(Button);

type DangerButtonWithDialogProps<TDialogState> = ButtonProps & {
    initialState: TDialogState;
    renderDialog: (
        state: TDialogState,
        onUpdateState: (newState: TDialogState) => void,
        onCloseDialog: () => void) => ReactNode;
};

type DangerButtonWithDialogState<TDialogState> = {
    dialogOpen: boolean;
    dialogState: TDialogState;
};

/**
 * A button that hints danger and shows a dialog when clicked.
 * @param props The button's properties.
 */
export class DangerButtonWithForm<TDialogState> extends Component<DangerButtonWithDialogProps<TDialogState>, DangerButtonWithDialogState<TDialogState>> {
    constructor(props: DangerButtonWithDialogProps<TDialogState>) {
        super(props);
        this.state = { dialogOpen: false, dialogState: props.initialState };
    }

    onOpenDialog() {
        this.setState({ dialogOpen: true, dialogState: this.props.initialState });
    }

    onCancelAction() {
        this.setState({ ...this.state, dialogOpen: false });
    }

    render() {
        return <React.Fragment>
            <DangerButton
                variant="contained"
                {...this.props}
                onClick={this.onOpenDialog.bind(this)} />
            <Dialog
                open={this.state.dialogOpen}
                onClose={this.onCancelAction.bind(this)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description">
                {this.props.renderDialog(
                    this.state.dialogState,
                    newState => this.setState({ ...this.state, dialogState: newState }),
                    () => this.setState({ ...this.state, dialogOpen: false }))}
            </Dialog>
        </React.Fragment>;
    }
}

type DangerButtonWithWarningProps = {
    confirmationDialogText: ReactNode,
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
};

/**
 * A button that hints danger and requires users to confirm before proceeding.
 * @param props The button's properties.
 */
export class DangerButtonWithWarning extends PureComponent<DangerButtonWithWarningProps> {
    render() {
        return <DangerButtonWithForm<{}> initialState={{}} renderDialog={(_state, _onUpdate, onClose) =>
            <React.Fragment>
                <DialogTitle id="alert-dialog-title">Are you sure?</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {this.props.confirmationDialogText}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="primary">No</Button>
                    <Button onClick={event => {
                        let callback = () => this.props.onClick(event);
                        onClose();
                        callback();
                    }} color="primary" autoFocus>Yes</Button>
                </DialogActions>
            </React.Fragment>
        }>
            {this.props.children}
        </DangerButtonWithForm>;
    }
}
