import React, { PureComponent } from "react";
import { Typography, Button } from "@material-ui/core";
import { isMobile } from 'react-device-detect';
import Anchor from '@material-ui/core/Link';
import './auth-page.css';

type Props = {
    clientId?: string;
    deviceId?: string;
    redirectUrl?: string;
};

function createRedditUrl(clientId: string, deviceId: string, redirectUrl: string, returnUrl: string, mobile: boolean): string {
    let requestPath = mobile ? "authorize.compact" : "authorize";
    return `https://www.reddit.com/api/v1/${requestPath}?client_id=${encodeURIComponent(clientId)}` +
        `&response_type=code&state=${encodeURIComponent(`${deviceId};${returnUrl}`)}` +
        `&redirect_uri=${encodeURIComponent(redirectUrl)}&duration=temporary&scope=identity`;
}

function makeid(length: number): string {
    // Based on csharptest.net's answer to this StackOverflow question:
    // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/**
 * Gets a unique identifier for this device.
 */
function getDeviceId(): string {
    const key = "deviceId";
    let val = localStorage.getItem(key);
    if (val) {
        return val;
    } else {
        val = makeid(20);
        localStorage.setItem(key, val);
        return val;
    }
}

/**
 * Gets a unique identifier for the user that is currently logged in.
 */
export function getUserId(): string | undefined {
    const key = "userId";
    let val = localStorage.getItem(key);
    if (val) {
        return val;
    } else {
        return undefined;
    }
}

/**
 * A page that allows user to authenticate using reddit.
 */
class AuthPage extends PureComponent<Props> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        let newProps = {
            clientId: this.props.clientId || "AvYTCpbWRP5rbA",
            deviceId: this.props.deviceId || getDeviceId(),
            redirectUrl: this.props.redirectUrl || "http://127.0.0.1:5000/reddit-auth"
        };
        let localUrl = createRedditUrl(
            newProps.clientId,
            newProps.deviceId,
            newProps.redirectUrl,
            window.location.pathname,
            isMobile);
        let otherUrl = createRedditUrl(
            newProps.clientId,
            newProps.deviceId,
            newProps.redirectUrl,
            window.location.pathname,
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

export default AuthPage;
