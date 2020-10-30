import React from "react";
import { Fab, FabProps, Theme, withStyles } from "@material-ui/core";
import { green } from "@material-ui/core/colors";
import CheckIcon from '@material-ui/icons/Check';
import { Without } from "../model/util";

const CheckFabTy = withStyles((theme: Theme) => ({
    root: {
        color: theme.palette.common.white,
        backgroundColor: green[500],
        '&:hover': {
            backgroundColor: green[600],
        }
    },
}))(Fab);

/**
 * A green floating action button with a checkmark inside.
 */
export function CheckFab(props: Without<FabProps, 'children'>) {
    return <CheckFabTy {...props}><CheckIcon /></CheckFabTy>;
}
