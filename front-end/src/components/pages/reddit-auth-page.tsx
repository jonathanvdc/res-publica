import React, { PureComponent } from "react";
import { Typography, Button } from "@material-ui/core";
import { isMobile } from 'react-device-detect';
import { DeviceDescription } from "../../api/auth";
import Anchor from '@material-ui/core/Link';
import './reddit-auth-page.css';

type DeviceInfo = {
    deviceId: string;
    persistentId: string;
    description: DeviceDescription;
};

type Props = {
    clientId: string;
    redirectUrl: string;
    deviceInfo: DeviceInfo;
};

function shrinkDeviceDescription(description: DeviceDescription): DeviceDescription {
    return { visitorId: description.visitorId, confidence: { score: description.confidence.score } };
}

function createRedditUrl(clientId: string, deviceInfo: DeviceInfo, redirectUrl: string, returnUrl: string, mobile: boolean): string {
    let requestPath = mobile ? "authorize.compact" : "authorize";
    console.log(deviceInfo);
    let stateComponents = [
        { ...deviceInfo, description: shrinkDeviceDescription(deviceInfo.description) },
        returnUrl
    ];
    let componentString = btoa(JSON.stringify(stateComponents));
    return `https://www.reddit.com/api/v1/${requestPath}?client_id=${encodeURIComponent(clientId)}` +
        `&response_type=code&state=${encodeURIComponent(componentString)}` +
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
            this.props.deviceInfo,
            this.props.redirectUrl,
            returnUrl,
            isMobile);

        let otherUrl = createRedditUrl(
            this.props.clientId,
            this.props.deviceInfo,
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
