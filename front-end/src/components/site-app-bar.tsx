import React, { Component } from "react";
import { AppBar, Toolbar, Typography, Menu, MenuItem, Chip, Avatar, SwipeableDrawer, List, ListItem, ListItemText, IconButton, ListItemIcon } from "@material-ui/core";
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuIcon from '@material-ui/icons/Menu';
import CreateIcon from '@material-ui/icons/Create';
import ListWithCheckIcon from '@material-ui/icons/PlaylistAddCheck';
import { Link } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { OptionalAPI } from "../model/api-client";
import "./site-app-bar.css";

type SiteAppBarProps = {
    onLogOut?: () => void;
    userId?: string;
    isAdmin?: boolean;
    optionalAPIs?: OptionalAPI[];
};

type SiteAppBarState = {
    anchorElement: null | HTMLElement;
    drawerOpen: boolean
};

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

    toggleDrawer(event: React.KeyboardEvent | React.MouseEvent) {
        if (event &&
            event.type === 'keydown' &&
            ((event as React.KeyboardEvent).key === 'Tab' ||
                (event as React.KeyboardEvent).key === 'Shift')) {
            return;
        }

        this.setState({ ...this.state, drawerOpen: !this.state.drawerOpen });
    }

    render() {
        let self = this;
        function ListItemLink<T>(props: T) {
            return <ListItem button component={Link} onClick={self.toggleDrawer.bind(self)} {...props} />;
        }
        let optionalAPIs = this.props.optionalAPIs || [];
        let drawerItems = [
            {
                adminOnly: true,
                item: <ListItemLink to="/admin/make-vote">
                    <ListItemIcon><CreateIcon /></ListItemIcon>
                    <ListItemText primary="Create New Vote" />
                </ListItemLink>
            }
        ];
        if (optionalAPIs.includes(OptionalAPI.registeredVoters)) {
            drawerItems.push({
                adminOnly: false,
                item: <ListItemLink to="/registered-voters">
                    <ListItemIcon><ListWithCheckIcon /></ListItemIcon>
                    <ListItemText primary="Registered Voters" />
                </ListItemLink>
            });
        }
        let adminDrawer = drawerItems.filter(x => x.adminOnly).length === drawerItems.length;

        return <AppBar position="sticky">
            <Toolbar variant={isMobile ? "regular" : "dense"}>
                {(this.props.isAdmin || !adminDrawer) &&
                    <IconButton edge="start" color="inherit" aria-label="menu" onClick={this.toggleDrawer.bind(this)}>
                        <MenuIcon />
                    </IconButton>}
                <Link to="/" className="ImplicitLink">
                    <Typography variant="h6">SimDem Voting Booth</Typography>
                </Link>
                {(this.props.isAdmin || !adminDrawer) && <SwipeableDrawer
                    anchor="left"
                    open={this.state.drawerOpen}
                    onClose={this.toggleDrawer.bind(this)}
                    onOpen={this.toggleDrawer.bind(this)}>
                    <List>
                        {drawerItems.filter(x => !x.adminOnly || this.props.isAdmin).map(x => x.item)}
                    </List>
                </SwipeableDrawer>}
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
                        <Link to="/prefs" className="ImplicitLink">
                            <MenuItem onClick={this.closeMenu.bind(this)}>Preferences</MenuItem>
                        </Link>
                        <MenuItem onClick={this.handleLogout.bind(this)}>Log Out</MenuItem>
                    </Menu>
                </div>
            </Toolbar>
        </AppBar>;
    }
}

export default SiteAppBar;
