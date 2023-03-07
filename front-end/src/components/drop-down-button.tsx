import React, { Component } from "react";
import { Menu, MenuItem, ListItemText } from "@mui/material";

type ButtonProps = {
    onClick: (event: React.MouseEvent<HTMLElement>) => void;
};

type Props = {
    button: (props: ButtonProps) => JSX.Element;
    options: { id: string, name: string }[];
    onSelectOption?: (optionId: string) => void;
};

type State = {
    menuAnchor: HTMLElement | null;
};

/**
 * A button that, when clicked, displays a menu containing a number of options.
 * A user can select one of the options.
 */
class DropDownButton extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { menuAnchor: null };
    }

    handleOpenMenu(event: React.MouseEvent<HTMLElement>) {
        this.setState({
            ...this.state,
            menuAnchor: event.currentTarget
        });
    }

    handleCloseMenu() {
        this.setState({
            ...this.state,
            menuAnchor: null
        });
    }

    handleClickOption(optionId: string) {
        if (this.props.onSelectOption) {
            this.props.onSelectOption(optionId);
        }
        this.handleCloseMenu();
    }

    render() {
        return <span>
            {this.props.button({ onClick: this.handleOpenMenu.bind(this) })}
            <Menu
                anchorEl={this.state.menuAnchor}
                open={Boolean(this.state.menuAnchor)}
                onClose={this.handleCloseMenu.bind(this)}>

                {this.props.options.map(option =>
                    <MenuItem onClick={() => this.handleClickOption(option.id)}>
                        <ListItemText primary={option.name} />
                    </MenuItem>)}
            </Menu>
        </span>
    }
}

export default DropDownButton;
