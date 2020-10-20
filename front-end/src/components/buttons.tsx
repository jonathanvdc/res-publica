import React from "react";
import { Button, Fab, FabProps, Theme, withStyles } from "@material-ui/core";
import { green, red } from "@material-ui/core/colors";
import CheckIcon from '@material-ui/icons/Check';

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

const CheckFabTy = withStyles((theme: Theme) => ({
    root: {
        color: theme.palette.common.white,
        backgroundColor: green[500],
        '&:hover': {
            backgroundColor: green[600],
        }
    },
}))(Fab);

type Without<T, K> = Pick<T, Exclude<keyof T, K>>;

/**
 * A green floating action button with a checkmark inside.
 */
export function CheckFab(props: Without<FabProps, 'children'>) {
    return <CheckFabTy {...props}><CheckIcon /></CheckFabTy>;
}
