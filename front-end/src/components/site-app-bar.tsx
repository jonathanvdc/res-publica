import React, { Component } from "react";
import { AppBar, Toolbar, Typography, Menu, MenuItem, Chip, Avatar } from "@material-ui/core";
import AccountCircle from '@material-ui/icons/AccountCircle';
import { Link } from "react-router-dom";
import { isMobile } from "react-device-detect";
import "./site-app-bar.css";

type SiteAppBarProps = {
    onLogOut?: () => void;
    userId?: string;
};

class SiteAppBar extends Component<SiteAppBarProps, { anchorElement: null | HTMLElement }> {
    constructor(props: SiteAppBarProps) {
        super(props);
        this.state = { anchorElement: null };
    }

    setAnchorEl(anchorElement: null | HTMLElement) {
        this.setState({ ...this.state, anchorElement });
    }

    handleMenu(event: React.MouseEvent<HTMLElement>) {
        this.setAnchorEl(event.currentTarget);
    }

    handleClose() {
        this.setAnchorEl(null);
    }

    handleLogout() {
        this.handleClose();
        if (this.props.onLogOut) {
            this.props.onLogOut();
        }
    }

    render() {
        return <AppBar position="sticky">
            <Toolbar variant={isMobile ? "regular" : "dense"}>
                <Link to="/" className="AppTitle">
                    <Typography variant="h6">SimDem Voting Booth</Typography>
                </Link>
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
                        onClose={this.handleClose.bind(this)}>
                        {/* <MenuItem onClick={this.handleClose.bind(this)}>Profile</MenuItem> */}
                        <MenuItem onClick={this.handleLogout.bind(this)}>Log Out</MenuItem>
                    </Menu>
                </div>
            </Toolbar>
        </AppBar>;
    }
}

export default SiteAppBar;
