import React, { Component } from "react";
import { Button, Collapse, Link } from "@material-ui/core";
import ReactMarkdown from "react-markdown";

type Props = {
    collapsedByDefault: boolean
};

type State = {
    isCollapsed: boolean
};

class CollapsibleMarkdown extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { isCollapsed: props.collapsedByDefault };
    }

    onToggleCollapsed() {
        this.setState({ isCollapsed: !this.state.isCollapsed });
    }

    render() {
        let content: JSX.Element;
        let buttonText: string;
        if (this.state.isCollapsed) {
            content = <Collapse collapsedHeight="5em">
                <ReactMarkdown {...this.props} />
            </Collapse>;
            buttonText = "Read more";
        } else {
            content = <ReactMarkdown {...this.props} />;
            buttonText = "Read less";
        }
        return <div>
            {content}
            <div style={{display: "flex"}}>
                <Button color="primary" onClick={this.onToggleCollapsed.bind(this)}>
                    {buttonText}
                </Button>
            </div>
        </div>;
    }
}

function countLines(source: string, lineLength: number = 80): number {
    let lineCount = 0;
    let emptyLineCount = 0;
    let whitespaceRegex = /^\s+$/;
    for (let line of source.split("\n")) {
        if (!line || whitespaceRegex.test(line)) {
            emptyLineCount++;
        } else {
            if (emptyLineCount > 0) {
                lineCount++;
            }

            lineCount += Math.ceil(line.length / lineLength);
            emptyLineCount = 0;
        }
    }
    return lineCount;
}

function renderLink(props: { href: string, title: string, children: any[] }) {
    return <Link href={props.href} title={props.title} target="_blank">{props.children}</Link>;
}

export function renderCollapsibleMarkdown(
    source: string,
    className: string,
    allowCollapse: boolean = true,
    collapsedByDefault: boolean = true): JSX.Element {

    const maxLines = 4;
    let renderers = {
        link: renderLink
    };
    let props = {
        className,
        source,
        renderers,
        escapeHtml: false,
        unwrapDisallowed: true
    };
    if (allowCollapse && countLines(source) > maxLines) {
        return <CollapsibleMarkdown {...props} collapsedByDefault={collapsedByDefault} />;
    } else {
        return <ReactMarkdown {...props} />;
    }
}

export default CollapsibleMarkdown;
