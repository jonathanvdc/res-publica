import React from "react";
import { Fab, FabProps, Theme, withStyles } from "@material-ui/core";
import { green } from "@material-ui/core/colors";
import CheckIcon from '@material-ui/icons/Check';

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
