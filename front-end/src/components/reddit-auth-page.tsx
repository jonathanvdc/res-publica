import React, { PureComponent } from "react";
import { Typography, Button } from "@material-ui/core";
import { isMobile } from 'react-device-detect';
import Anchor from '@material-ui/core/Link';
import './reddit-auth-page.css';

type Props = {
    clientId: string;
    deviceId: string;
    redirectUrl: string;
};

function createRedditUrl(clientId: string, deviceId: string, redirectUrl: string, returnUrl: string, mobile: boolean): string {
    let requestPath = mobile ? "authorize.compact" : "authorize";
    return `https://www.reddit.com/api/v1/${requestPath}?client_id=${encodeURIComponent(clientId)}` +
        `&response_type=code&state=${encodeURIComponent(`${deviceId};${returnUrl}`)}` +
        `&redirect_uri=${encodeURIComponent(redirectUrl)}&duration=temporary&scope=identity`;
}

/**
 * A page that allows user to authenticate using reddit.
 */
class RedditAuthPage extends PureComponent<Props> {
    render() {
        let returnUrl = window.location.pathname + window.location.hash + window.location.search;

        let localUrl = createRedditUrl(
            this.props.clientId,
            this.props.deviceId,
            this.props.redirectUrl,
            returnUrl,
            isMobile);

        let otherUrl = createRedditUrl(
            this.props.clientId,
            this.props.deviceId,
            this.props.redirectUrl,
            returnUrl,
            !isMobile);

        return <div className="SignInBox">
            <div className="SignInFillerBox" />
            <div className="SignInContentBox">
                <Typography variant="h1">Howdy!</Typography>
                <Typography>Please sign in with Reddit to continue.</Typography>
                <a className="SignInLink" href={localUrl}>
                    <Button className="SignInButton" variant="contained" color="primary">Sign in with Reddit</Button>
                </a>
            </div>
            <div className="SignInFillerBox" />
            <div className="SignInBottomBox">
                <Typography>Alternatively, here's the <Anchor href={otherUrl}>{isMobile ? "desktop" : "mobile"} sign-in page</Anchor>.</Typography>
            </div>
        </div>;
    }
}

export default RedditAuthPage;
