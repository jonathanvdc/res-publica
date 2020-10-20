import React, { Component, ReactNode } from "react";
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

type DangerButtonWithWarningProps = ButtonProps & {
    confirmationDialogText: ReactNode,
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
};

type DangerButtonWithWarningState = {
    dialogOpen: boolean;
};

/**
 * A button that hints danger and requires users to confirm before proceeding.
 * @param props The button's properties.
 */
export class DangerButtonWithWarning extends Component<DangerButtonWithWarningProps, DangerButtonWithWarningState> {
    constructor(props: DangerButtonWithWarningProps) {
        super(props);
        this.state = { dialogOpen: false };
    }

    onOpenDialog() {
        this.setState({ dialogOpen: true });
    }

    onCancelAction() {
        this.setState({ dialogOpen: false });
    }

    onProceedWithAction(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        if (this.state.dialogOpen) {
            let callback = () => this.props.onClick(event);
            this.onCancelAction();
            callback();
        }
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
                <DialogTitle id="alert-dialog-title">Are you sure?</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {this.props.confirmationDialogText}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onCancelAction.bind(this)} color="primary">No</Button>
                    <Button onClick={this.onProceedWithAction.bind(this)} color="primary" autoFocus>Yes</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>;
    }
}
