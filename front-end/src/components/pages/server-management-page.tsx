import React, { PureComponent } from "react";
import { DangerButtonWithWarning } from "../danger-button";
import TitlePaper from "../title-paper";

type Props = {
    onUpgradeServer: () => void;
};

const upgradeWarningMessage = "This will shut down the server, upgrade it to the latest version of Res Publica and then restart it. " +
    "If something goes wrong during this process, a human administrator will have to intervene. Proceed?";

/**
 * A page that allows users to manage the server.
 */
class ServerManagementPage extends PureComponent<Props> {
    render() {
        return <TitlePaper title="Server Management">
            <DangerButtonWithWarning
                onClick={this.props.onUpgradeServer}
                confirmationDialogText={upgradeWarningMessage}>
                Upgrade and Restart Server
            </DangerButtonWithWarning>
        </TitlePaper>;
    }
}

export default ServerManagementPage;
