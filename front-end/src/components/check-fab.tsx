import React from "react";
import { Fab, FabProps, Theme } from "@mui/material";
import { withStyles } from "tss-react/mui";
import { green } from "@mui/material/colors";
import CheckIcon from '@mui/icons-material/Check';
import { Without } from "../model/util";

const CheckFabTy = withStyles(
    Fab,
    (theme: Theme) => ({
        root: {
            color: theme.palette.common.white,
            backgroundColor: green[500],
            '&:hover': {
                backgroundColor: green[600],
            }
        },
    }));

/**
 * A green floating action button with a checkmark inside.
 */
export function CheckFab(props: Without<FabProps, 'children'>) {
    return <CheckFabTy {...props}><CheckIcon /></CheckFabTy>;
}
