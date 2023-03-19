import React, { Component } from "react";
import { AppBar, Toolbar, Menu, MenuItem, Chip, Avatar, SwipeableDrawer, List, ListItem, ListItemText, IconButton, ListItemIcon, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import CreateIcon from '@mui/icons-material/Create';
import BuildIcon from '@mui/icons-material/Build';
import ListWithCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import ExitIcon from '@mui/icons-material/ExitToApp';
import { Link } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { Permission } from "../api/api-client";
import Logo from "../logo.svg";
import "./site-app-bar.css";
import { enablePreferences } from "../model/preferences";

type SiteAppBarProps = {
    onLogOut?: () => void;
    onUnregisterUser?: () => void;
    userId?: string;
    permissions?: Permission[];
};

type SiteAppBarState = {
    anchorElement: null | HTMLElement;
    drawerOpen: boolean
};

type DrawerItemBase = {
    showItem: (props: SiteAppBarProps) => boolean;
};

type LinkDrawerItem = DrawerItemBase & {
    link: string;
    text: string;
    icon: React.ReactNode;
};

type DividerDrawerItem = DrawerItemBase & {
    divider: true;
};

type DangerousActionDrawerItem = DrawerItemBase & {
    text: string;
    icon: React.ReactNode;
    action: (props: SiteAppBarProps) => void;
    warningTitle: string;
    warningMessage: string;
};

type DrawerItem = LinkDrawerItem | DividerDrawerItem | DangerousActionDrawerItem;

const drawerItems: DrawerItem[] = [
    {
        showItem: props => !!props.permissions?.includes(Permission.CreateVote),
        link: "/admin/make-vote",
        text: "Create New Vote",
        icon: <CreateIcon />
    },
    {
        showItem: props => !!props.permissions?.includes(Permission.ViewRegisteredUsers),
        link: "/registered-voters",
        text: "Registered Voters",
        icon: <ListWithCheckIcon />
    },
    {
        showItem: props => !!props.permissions?.includes(Permission.UpgradeServer),
        link: "/server-management",
        text: "Server Management",
        icon: <BuildIcon />
    },
    {
        showItem: _props => true,
        divider: true
    },
    {
        showItem: props => !!props.onUnregisterUser,
        text: "Unregister",
        icon: <ExitIcon />,
        warningTitle: "Are you sure?",
        warningMessage: "If you unregister, your account and its associated data will be deleted. " +
            "Previously-cast votes will be retained. " +
            "If you intend to vote in the future, you will have to re-register.",
        action: props => props.onUnregisterUser!()
    }
];

type DangerousActionDrawerItemComponentProps = {
    item: DangerousActionDrawerItem;
    globalProps: SiteAppBarProps;
    toggleDrawer: () => void;
}

class DangerousActionDrawerItemComponent
    extends Component<DangerousActionDrawerItemComponentProps, { dialogOpen: boolean }> {

    constructor(props: DangerousActionDrawerItemComponentProps) {
        super(props);
        this.state = { dialogOpen: false };
    }

    setOpen(dialogOpen: boolean) {
        this.setState({ dialogOpen });
    }

    render() {
        let { item, globalProps } = this.props;
        return <React.Fragment>
            <ListItem button onClick={() => this.setOpen(true)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
            </ListItem>
            <Dialog onClose={() => this.setOpen(false)} aria-labelledby="dialog-title" open={this.state.dialogOpen}>
                <DialogTitle id="dialog-title">{item.warningTitle}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="dialog-description">
                        {item.warningMessage}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.setOpen(false)} color="primary">No</Button>
                    <Button onClick={_event => {
                        this.setOpen(false);
                        item.action(globalProps);
                    }} color="primary" autoFocus>Yes</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>;
    }
}

function renderDrawerItem(
    item: DrawerItem,
    props: SiteAppBarProps,
    toggleDrawer: () => void): React.ReactNode {

    function ListItemLink<T>(props: T) {
        return <ListItem button component={Link} onClick={toggleDrawer} {...props} />;
    }

    if ('link' in item) {
        return <ListItemLink to={item.link}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
        </ListItemLink>;
    } else if ('divider' in item) {
        return <Divider />;
    } else {
        return <DangerousActionDrawerItemComponent item={item} globalProps={props} toggleDrawer={toggleDrawer} />;
    }
}

class SiteAppBar extends Component<SiteAppBarProps, SiteAppBarState> {
    constructor(props: SiteAppBarProps) {
        super(props);
        this.state = { anchorElement: null, drawerOpen: false };
    }

    setAnchorEl(anchorElement: null | HTMLElement) {
        this.setState({ ...this.state, anchorElement });
    }

    handleMenu(event: React.MouseEvent<HTMLElement>) {
        this.setAnchorEl(event.currentTarget);
    }

    closeMenu() {
        this.setAnchorEl(null);
    }

    handleLogout() {
        this.closeMenu();
        if (this.props.onLogOut) {
            this.props.onLogOut();
        }
    }

    toggleDrawer() {
        this.setState({ ...this.state, drawerOpen: !this.state.drawerOpen });
    }

    onToggleDrawer(event: React.KeyboardEvent | React.MouseEvent) {
        if (event &&
            event.type === 'keydown' &&
            ((event as React.KeyboardEvent).key === 'Tab' ||
                (event as React.KeyboardEvent).key === 'Shift')) {
            return;
        }

        this.toggleDrawer();
    }

    render() {
        let instantiatedDrawerItems = drawerItems
            .filter(item => item.showItem(this.props))
            .map(item => renderDrawerItem(item, this.props, this.toggleDrawer.bind(this)));

        return <AppBar position="sticky">
            <Toolbar variant={isMobile ? "regular" : "dense"}>
                <IconButton edge="start" color="inherit" aria-label="menu" onClick={this.onToggleDrawer.bind(this)}>
                    <MenuIcon />
                </IconButton>
                <Link to="/" className="ImplicitLink">
                    <img style={{height: "32px"}} src={Logo} alt="SimDem Voting Booth"/>
                </Link>
                <SwipeableDrawer
                    anchor="left"
                    open={this.state.drawerOpen}
                    onClose={this.onToggleDrawer.bind(this)}
                    onOpen={this.onToggleDrawer.bind(this)}>
                    <List>
                        {instantiatedDrawerItems}
                    </List>
                </SwipeableDrawer>
                <span className="AppBarFiller" />
                <div>
                    <Chip
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        label={this.props.userId}
                        avatar={<Avatar><AccountCircle /></Avatar>}
                        onClick={this.handleMenu.bind(this)} />
                    <Menu
                        id="menu-appbar"
                        anchorEl={this.state.anchorElement}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={!!this.state.anchorElement}
                        onClose={this.closeMenu.bind(this)}>
                        {enablePreferences ? <Link to="/prefs" className="ImplicitLink">
                            <MenuItem onClick={this.closeMenu.bind(this)}>Preferences</MenuItem>
                        </Link> : []}
                        <MenuItem onClick={this.handleLogout.bind(this)}>Log Out</MenuItem>
                    </Menu>
                </div>
            </Toolbar>
        </AppBar>;
    }
}

export default SiteAppBar;
