import React, { Suspense, Component } from 'react';
import './App.css';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { VoteAndBallots, Vote, Ballot, isActive, tryGetTallyVisualizer, VoteOption, getBallotKind } from './model/vote';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Route, BrowserRouter, Prompt } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { green } from '@mui/material/colors';
import VoteList from './components/vote-list';
import { Typography, Button } from '@mui/material';
import { saveAs } from 'file-saver';
import VotePage from './components/pages/vote-page';
import { FetchedStateComponent } from './components/fetched-state-component';
import VoteConfirmationPage from './components/pages/vote-confirmation-page';
import { ServerAPIClient } from './api/server-api-client';
import MakeVotePage from './components/pages/make-vote-page';
import MakeVoteConfirmationPage from './components/pages/make-vote-confirmation-page';
import ScrapeCFCPage from './components/pages/scrape-cfc-page';
import BallotTable, { ballotsToCsv } from './components/ballot-table';
import { AuthenticationLevel } from './api/auth';
import SiteAppBar from './components/site-app-bar';
import { UserPreferences, getPreferences, setPreferences, enablePreferences } from './model/preferences';
import PreferencesPage from './components/pages/preferences-page';
import AuthFailedPage from './components/pages/auth-failed-page';
import { Permission } from './api/api-client';
import RegisteredVotersList from './components/registered-voter-list';
import TitlePaper from './components/title-paper';
import { currentSeasons, getSeasonalPropertyValue } from './model/season';
import ServerManagementPage from './components/pages/server-management-page';
import VisualizeTallyPage from './components/pages/visualize-tally-page';
import { DeviceDescription, SuspiciousBallot } from './model/voting/types';

const theme = createTheme({
  palette: {
    primary: {
      main: getSeasonalPropertyValue({
        seasonal: [
          ['Halloween', '#ff5722']
        ],
        default: '#1976d2'
      }),
    },
    secondary: green
  },
});

const fpPromise = FingerprintJS.load({ monitoring: false });
const apiClient = new ServerAPIClient();
const authenticator = apiClient.authenticator;
const enableFingerprinting = true;

type AppState = {
  authLevel: AuthenticationLevel;
  authPage?: JSX.Element;
  userId?: string;
  permissions?: Permission[];
};

class App extends FetchedStateComponent<{}, AppState> {
  fetchPermissions(): Promise<Permission[]> {
    return apiClient.optional.getPermissions();
  }
  getMainClass(): string {
    return ["App", ...currentSeasons].join(" ");
  }

  async fetchState(): Promise<AppState> {
    let authLevel = await authenticator.isAuthenticated();
    if (authLevel === AuthenticationLevel.Unauthenticated) {
      let fingerprint: DeviceDescription;
      if (enableFingerprinting) {
        const fp = await fpPromise;
        fingerprint = await fp.get();
      } else {
        fingerprint = {
          visitorId: "unknown",
          confidence: {
            score: 0
          }
        };
      }
      let authPage = await authenticator.createAuthenticationPage(fingerprint);
      return { authLevel, authPage };
    } else {
      let userId = await authenticator.getUserId();
      let permissions = await apiClient.optional.getPermissions();
      return { authLevel, userId, permissions };
    }
  }

  onLogOut() {
    authenticator.logOut();
    this.setState({ hasConnected: false });
    this.refetchInitialState();
  }

  async onUnregisterUser() {
    await authenticator.unregisterUser();
    this.setState({ hasConnected: false });
    this.refetchInitialState();
  }

  renderState(state: AppState): JSX.Element {
    if (state.authLevel === AuthenticationLevel.Unauthenticated) {
      let parsedUrl = new URL(window.location.href);
      let pathname = parsedUrl.pathname;
      if (pathname.endsWith('/')) {
        pathname = pathname.slice(0, pathname.length - 1);
      }

      let content: JSX.Element | undefined;
      if (parsedUrl.pathname.endsWith("/auth-failed")) {
        // Auth might have failed. In that case, display the auth failed page.
        let requirementsText = parsedUrl.searchParams.get("requirements");
        let requirements = requirementsText ? JSON.parse(requirementsText) : undefined;
        content = <AuthFailedPage error={parsedUrl.searchParams.get("error")!} requirements={requirements} />;
      } else {
        // If we aren't logged in yet, then we'll send the user to
        // an authentication page.
        content = state.authPage;
      }
      return <div className={this.getMainClass()}>
          <div className="App-body App-login">
            {content}
          </div>
        </div>;
    }

    return <BrowserRouter>
      <div className={this.getMainClass()}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ThemeProvider theme={theme}>
          <SiteAppBar
            onLogOut={this.onLogOut.bind(this)}
            onUnregisterUser={this.onUnregisterUser.bind(this)}
            userId={state.userId}
            permissions={state.permissions} />
          <div className="App-body">
            <Suspense fallback={<div>Loading...</div>}>
              <Route exact path="/" component={VoteListRoute} />
              {enablePreferences ? <Route exact path="/prefs" component={PreferencesRoute} /> : []}
              <Route exact path="/vote/:voteId" component={(props: any) => <VoteRoute {...props} />} />
              <Route exact path="/vote/:voteId/ballots" component={VoteBallotsRoute} />
              <Route exact path="/vote/:voteId/visualize" component={VoteVisualizationRoute} />
              {this.permissions.includes(Permission.EditVote) && <Route exact path="/vote/:voteId/edit" component={EditVoteRoute} />}
              {this.permissions.includes(Permission.CreateVote) && <Route exact path="/admin/make-vote" component={MakeVoteRoute} />}
              {state.permissions && state.permissions.includes(Permission.ViewRegisteredUsers) &&
                <Route exact path="/registered-voters" component={RegisteredVotersRoute} />}
              {state.permissions && state.permissions.includes(Permission.UpgradeServer) &&
                <Route exact path="/server-management" component={ServerManagementRoute} />}
            </Suspense>
          </div>
        </ThemeProvider>
      </LocalizationProvider>
      </div>
    </BrowserRouter>;
  }
}

class PreferencesRoute extends Component<{ match: any }, UserPreferences> {
  constructor(props: { match: any }) {
    super(props);
    this.state = getPreferences();
  }

  onChange(preferences: UserPreferences) {
    setPreferences(preferences);
    this.setState(preferences);
  }

  render() {
    return <PreferencesPage preferences={this.state} onChange={this.onChange.bind(this)} />;
  }
}

type VoteListRouteState = {
  active: VoteAndBallots[];
  past: Vote[];
};

class VoteListRoute extends FetchedStateComponent<{ match: any }, VoteListRouteState> {
  fetchPermissions(): Promise<Permission[]> {
    return apiClient.optional.getPermissions();
  }
  async fetchState(): Promise<VoteListRouteState> {
    let activePromise = apiClient.getActiveVotes();
    let allPromise = apiClient.getAllVotes();
    let active = await activePromise;
    let all = await allPromise;
    return {
      active,
      past: all.filter(x => !active.find(y => y.vote.id === x.id))
    };
  }

  renderState(data: VoteListRouteState): JSX.Element {
    return <div>
      {
        data.active.length > 0 ? [
          <Typography variant="h2">Active Votes</Typography>,
          <VoteList votes={data.active} />
        ] : [
          <Typography>No votes are currently active. Check back later!</Typography>,
        ]
      }
      {
        data.past.length > 0 && [
          <Typography variant="h2">Closed Votes</Typography>,
          <VoteList votes={data.past.map(vote => ({ vote, ballots: [] }))} />
        ]
      }
      
    </div>;
  }
}

type VoteRouteState = {
  vote?: VoteAndBallots;
  permissions?: Permission[];
  ballotCast?: boolean;
  ballotId?: string;
  suspiciousBallots?: SuspiciousBallot[];
};

class VoteRoute extends FetchedStateComponent<{ match: any, history: any, permissions: Permission[] }, VoteRouteState> {
  fetchPermissions(): Promise<Permission[]> {
    return apiClient.optional.getPermissions();
  }
  async fetchState(): Promise<VoteRouteState> {
    let voteId = this.props.match.params.voteId;
    let data = await apiClient.getVote(voteId);
    let suspiciousBallots = this.props.permissions?.includes(Permission.ViewSuspiciousVotes) ? await apiClient.electionManagement.getSuspiciousBallots(voteId) : [];
    return { vote: data, ballotCast: false, suspiciousBallots };
  }

  async onCastBallot(vote: Vote, ballot: Ballot) {
    this.setState({ hasConnected: true, data: { ...this.state.data, ballotCast: true } });
    let response = await apiClient.castBallot(vote.id, ballot);
    if ('error' in response) {
      this.setState({ hasConnected: true, error: response.error });
    } else {
      this.setState({ hasConnected: true, data: { ballotId: response.id, ballotCast: true } });
    }
  }

  async onCancelVote(voteId: string) {
    if (await apiClient.electionManagement.cancelVote(voteId)) {
      this.props.history.push('/');
    }
  }

  async onResign(voteId: string, optionId: string) {
    let vote = await apiClient.electionManagement.resign(voteId, optionId);
    console.log(vote);
    if ('error' in vote) {
      this.setState({ hasConnected: true, error: vote.error });
    } else {
      let oldVote = this.state.data?.vote;
      this.setState({ ...this.state, data: { ...this.state.data, vote: { ...oldVote!, vote } } });
    }
  }

  async onAddOption(voteId: string, option: VoteOption) {
    let vote = await apiClient.electionManagement.addVoteOption(voteId, option);
    console.log(vote);
    if ('error' in vote) {
      this.setState({ hasConnected: true, error: vote.error });
    } else {
      let oldVote = this.state.data?.vote;
      this.setState({ ...this.state, data: { ...this.state.data, vote: { ...oldVote!, vote } } });
    }
  }

  renderState(data: VoteRouteState): JSX.Element {
    if (!data.vote && !data.ballotCast) {
      return <div>
        <h1>Error 404</h1>
        Vote with ID '{this.props.match.params.voteId}' not found.
      </div>;
    }

    if (data.vote) {
      return <React.Fragment>
        <Prompt
          when={!data.ballotCast && !data.vote.ownBallot && isActive(data.vote.vote)}
          message="You haven't cast your ballot yet. Are you sure you want to leave?" />
        <VotePage
          voteAndBallots={data.vote}
          permissions={data.permissions ?? []}
          suspiciousBallots={data.suspiciousBallots}
          ballotCast={data.ballotCast}
          onCastBallot={this.onCastBallot.bind(this)}
          onCancelVote={() => this.onCancelVote(data.vote!.vote.id)}
          onResign={optionId => this.onResign(data.vote!.vote.id, optionId)}
          onAddOption={option => this.onAddOption(data.vote!.vote.id, option)} />
      </React.Fragment>;
    } else {
      return <VoteConfirmationPage ballotId={data.ballotId!} />;
    }
  }
}

class EditVoteRoute extends FetchedStateComponent<{ match: any, history: any }, MakeVoteRouteState> {
  fetchPermissions(): Promise<Permission[]> {
    return apiClient.optional.getPermissions();
  }
  async fetchState(): Promise<MakeVoteRouteState> {
    let data = await apiClient.getVote(this.props.match.params.voteId);
    return { phase: "editing", draftVote: data?.vote };
  }

  async onSubmitEdits(proposal: Vote) {
    this.setState({ ...this.state, data: { ...this.state.data, phase: "submitted" } });
    try {
      let vote = await apiClient.electionManagement.editVote(proposal);
      if ("error" in vote) {
        this.setState({ ...this.state, error: vote.error });
      } else {
        this.setState({ ...this.state, data: { ...this.state.data, phase: "submitted", createdVote: vote } });
      }
    } catch (ex) {
      this.setState({ ...this.state, error: ex });
    }
  }

  onUpdateDraft(draftVote: Vote) {
    let oldId = this.state.data?.draftVote?.id;
    if (oldId) {
      draftVote = { ...draftVote, id: oldId };
    }
    this.setState({ ...this.state, data: { phase: "editing", draftVote } });
  }

  renderState(data: MakeVoteRouteState): JSX.Element {
    if (!data.draftVote || data.phase === "scraping-cfc") {
      return <div>
        <h1>Error 404</h1>
        Vote with ID '{this.props.match.params.voteId}' not found.
      </div>;
    }

    if (data.createdVote) {
      return <MakeVoteConfirmationPage voteId={data.createdVote.id} />;
    } else {
      return <MakeVotePage
        draft={data.draftVote}
        hasSubmittedVote={data.phase === "submitted"}
        allowAddOptions={isActive(data.draftVote)}
        allowRemoveOptions={isActive(data.draftVote)}
        allowChangeEnd={isActive(data.draftVote)}
        allowedTallyingAlgorithms={
          getBallotKind(data.draftVote.type) === "choose-one" ? ["first-past-the-post", "sainte-lague", "simdem-sainte-lague"] : ["star", "spsv"]}
        onMakeVote={this.onSubmitEdits.bind(this)}
        onUpdateDraft={this.onUpdateDraft.bind(this)} />
    }
  }
}

class VoteBallotsRoute extends FetchedStateComponent<{ match: any, history: any }, VoteAndBallots | undefined> {
  fetchPermissions(): Promise<Permission[]> {
    return apiClient.optional.getPermissions();
  }
  fetchState(): Promise<VoteAndBallots | undefined> {
    return apiClient.getVote(this.props.match.params.voteId);
  }

  onDownloadBallots() {
    let blob = new Blob([ballotsToCsv(this.state.data!)], {type: "text/csv;charset=utf-8"});
    saveAs(blob, this.state.data?.vote.id + '.csv');
  }

  renderState(data: VoteAndBallots | undefined): JSX.Element {
    if (!data) {
      return <div>
        <h1>Error 404</h1>
        Vote with ID '{this.props.match.params.voteId}' not found.
      </div>;
    }

    return <div>
      <BallotTable voteAndBallots={data} />
      <Button variant="contained" onClick={this.onDownloadBallots.bind(this)} style={{margin: "1em"}}>
        Download as CSV
      </Button>
    </div>;
  }
}

class VoteVisualizationRoute extends FetchedStateComponent<{ match: any, history: any }, VoteAndBallots | undefined> {
  fetchPermissions(): Promise<Permission[]> {
    return apiClient.optional.getPermissions();
  }
  fetchState(): Promise<VoteAndBallots | undefined> {
    return apiClient.getVote(this.props.match.params.voteId);
  }

  renderState(data: VoteAndBallots | undefined): JSX.Element {
    if (!data) {
      return <div>
        <h1>Error 404</h1>
        Vote with ID '{this.props.match.params.voteId}' not found.
      </div>;
    }

    return <VisualizeTallyPage rounds={tryGetTallyVisualizer(data)!(data)} />;
  }
}

type MakeVoteRouteState = {
  phase: "scraping-cfc" | "editing" | "submitted",
  draftVote?: Vote,
  createdVote?: Vote
};

class MakeVoteRoute extends FetchedStateComponent<{ history: any }, MakeVoteRouteState> {
  fetchPermissions(): Promise<Permission[]> {
    return apiClient.optional.getPermissions();
  }
  async fetchState(): Promise<MakeVoteRouteState> {
    return this.skipInitialStateFetch();
  }

  skipInitialStateFetch(): MakeVoteRouteState {
    return {
      phase: "scraping-cfc"
    };
  }

  async onMakeVote(proposal: Vote) {
    this.setState({ ...this.state, data: { ...this.state.data, phase: "submitted" } });
    try {
      let vote = await apiClient.electionManagement.createVote(proposal);
      this.setState({ ...this.state, data: { ...this.state.data, phase: "submitted", createdVote: vote } });
    } catch (ex) {
      this.setState({ ...this.state, error: ex });
    }
  }

  onSubmitDraft(draft?: Vote) {
    if (!draft) {
      draft = {
          id: 'new-vote',
          name: 'Vote Title',
          description: 'A vote on something.',
          deadline: Date.now() / 1000 + 60 * 60 * 24,
          options: [],
          type: {
              tally: 'first-past-the-post'
          }
      };
    }
    this.setState({ ...this.state, data: { phase: "editing", draftVote: draft } });
  }

  onUpdateDraft(draft: Vote) {
    this.setState({ ...this.state, data: { phase: "editing", draftVote: draft } });
  }

  onScrape(url: string, detectCandidates: boolean): Promise<Vote> {
    return apiClient.electionManagement.scrapeCfc(url, detectCandidates);
  }

  renderState(data: MakeVoteRouteState): JSX.Element {
    if (data.phase === "scraping-cfc") {
      return <ScrapeCFCPage onSubmitDraft={this.onSubmitDraft.bind(this)} scrape={this.onScrape.bind(this)} />;
    }

    if (data.createdVote) {
      return <MakeVoteConfirmationPage voteId={data.createdVote.id} />;
    } else {
      return <MakeVotePage
        draft={data.draftVote!}
        onUpdateDraft={this.onUpdateDraft.bind(this)}
        hasSubmittedVote={data.phase === "submitted"}
        onMakeVote={this.onMakeVote.bind(this)} />;
    }
  }
}

type RegisteredVotersState = {
  voters: string[];
  permissions: string[];
};

class RegisteredVotersRoute extends FetchedStateComponent<{ match: any, history: any }, RegisteredVotersState> {
  fetchPermissions(): Promise<Permission[]> {
    return apiClient.optional.getPermissions();
  }
  async fetchState(): Promise<RegisteredVotersState> {
    let permissions = apiClient.optional.getPermissions();
    let voters = apiClient.optional.getRegisteredVoters();
    return {
      voters: await voters,
      permissions: await permissions
    };
  }

  async onAddVoter(username: string) {
    this.waitAndContinue(
      apiClient.optional.addRegisteredVoter(username),
      () => this.refetchInitialState());
  }

  async onRemoveVoter(username: string) {
    this.waitAndContinue(
      apiClient.optional.removeRegisteredVoter(username),
      () => this.refetchInitialState());
  }

  renderState(data: RegisteredVotersState): JSX.Element {
    let onAdd = data.permissions.includes(Permission.AddRegisteredUser) ? this.onAddVoter.bind(this) : undefined;
    let onRemove = data.permissions.includes(Permission.RemoveRegisteredUser) ? this.onRemoveVoter.bind(this) : undefined;
    return <TitlePaper title="Registered Voters">
      <Typography>There are currently {data.voters.length} registered voters.</Typography>
      <RegisteredVotersList registeredVoters={data.voters} addRegisteredVoter={onAdd} removeRegisteredVoter={onRemove} />
    </TitlePaper>;
  }
}

class ServerManagementRoute extends FetchedStateComponent<{ match: any, history: any }, {}> {
  fetchPermissions(): Promise<Permission[]> {
    return apiClient.optional.getPermissions();
  }
  async fetchState(): Promise<{}> {
    return {};
  }

  onUpgradeServer() {
    this.waitAndContinue(
      apiClient.optional.upgradeServer(),
      () => {});
  }

  renderState(_data: {}): JSX.Element {
    return <ServerManagementPage onUpgradeServer={this.onUpgradeServer.bind(this)} />;
  }
}

export default App;
