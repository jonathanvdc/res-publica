import React, { Component } from "react";
import ErrorPage from "./pages/error-page";
import { Permission } from "../api/api-client";

export type FetchedState<T> = {
    hasConnected: boolean;
    data?: T;
    error?: any;
};

/**
 * A component that fetches its state and renders it once fetched.
 */
export abstract class FetchedStateComponent<TProps, TData> extends Component<TProps, FetchedState<TData>> {
    permissions: Permission[];
    constructor(props: TProps) {
        super(props);
        this.permissions = this.skipInitialPermissionsFetch();
        let initState = this.skipInitialStateFetch();
        if (initState) {
            this.state = {
                hasConnected: true,
                data: initState
            };
        } else {
            this.state = {
                hasConnected: false
            };
        }
    }

    abstract fetchState(): Promise<TData>;
    abstract fetchPermissions(): Promise<Permission[]>;
    abstract renderState(data: TData): JSX.Element;

    skipInitialStateFetch(): TData | undefined {
        return undefined;
    }

    skipInitialPermissionsFetch(): Permission[] {
        return [];
    }

    refetchInitialState() {
        // Check if we're authenticated. Update state accordingly.
        this.fetchState()
        .then(
            val => this.setState({ hasConnected: true, data: val }),
            reason => this.setState({ hasConnected: false, error: reason }));

        this.fetchPermissions()
        .then(
            perm => this.permissions = perm
            )
    }

    async waitAndContinue<T>(promise: Promise<T>, continuation: (data: T) => void) {
        try {
            continuation(await promise);
        } catch (error) {
            this.setState({ hasConnected: false, error });
        }
    }

    componentDidMount() {
        if (this.state.hasConnected) {
            return;
        }

        this.refetchInitialState();
    }

    renderError(error: any) {
        return <ErrorPage error={error} />;
    }

    renderWaiting() {
        return <div />;
    }

    render() {
        if (!this.state.hasConnected) {
            if (this.state.error) {
                return this.renderError(this.state.error);
            } else {
                return this.renderWaiting();
            }
        } else {
            return this.renderState(this.state.data!);
        }
    }
}
