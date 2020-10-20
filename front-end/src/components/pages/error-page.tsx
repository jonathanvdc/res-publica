import React, { PureComponent } from "react";
import { Typography } from "@material-ui/core";
import { NetworkError } from "../../model/exceptions";

type Props = {
    error: any;
};

/**
 * A card that allows users to inspect and interact with a vote.
 */
class ErrorPage extends PureComponent<Props> {
    render() {
        let error = this.props.error;
        if (error instanceof NetworkError) {
            return <div>
                <Typography variant="h1">Oops</Typography>
                <Typography>
                    Something went wrong.
                    We got a {error.response.status} {error.response.statusText} when
                    connecting to <b>{new URL(error.response.url).origin}</b>.
                </Typography>
            </div>;
        } else if (error instanceof TypeError && error.message.startsWith('NetworkError')) {
            return <div>
                <Typography variant="h1">Oops</Typography>
                <Typography>
                    Something went wrong.
                    We got a network error when attempting to contact a server.
                </Typography>
                <Typography>
                    This may be a local connectivity issue. Are you sure that you're connected to the Internet?
                </Typography>
            </div>;
        }

        return <div>
            <Typography variant="h1">Oops</Typography>
            <Typography>
                An error occurred.
            </Typography>
            <Typography>
                Reason: {error.toString()}
            </Typography>
        </div>;
    }
}

export default ErrorPage;
