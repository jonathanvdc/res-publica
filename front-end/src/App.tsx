import React, { Suspense } from 'react';
import './App.css';
import { VoteAndBallots, Vote, Ballot } from './model/vote';
import { Route, BrowserRouter } from 'react-router-dom';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { green } from '@material-ui/core/colors';
import VoteList from './components/vote-list';
import { Typography, Button } from '@material-ui/core';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import { saveAs } from 'file-saver';
import { DummyAPIClient } from './model/dummy-api-client';
import VotePage from './components/vote-page';
import { FetchedStateComponent } from './components/fetched-state-component';
import VoteConfirmationPage from './components/vote-confirmation-page';
import { ServerAPIClient } from './model/server-api-client';
import MakeVotePage from './components/make-vote-page';
import MakeVoteConfirmationPage from './components/make-vote-confirmation-page';
import ScrapeCFCPage from './components/scrape-cfc-page';
import BallotTable, { ballotsToCsv } from './components/ballot-table';

let currentSeasons: string[] = [];

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: green
  },
});

const apiClient = new DummyAPIClient();
const authenticator = apiClient.authenticator;


class App extends FetchedStateComponent<{}, boolean> {
  getMainClass(): string {
    return ["App", ...currentSeasons].join(" ");
  }

  fetchState(): Promise<boolean> {
    return authenticator.isAuthenticated();
  }

  renderState(isAuthenticated: boolean): JSX.Element {
    if (!isAuthenticated) {
      // If we aren't logged in yet, then we'll send the user to
      // an authentication page.
      return <div className={this.getMainClass()}>
        <header className="App-header">
          {authenticator.createAuthenticationPage()}
        </header>
      </div>;
    }

    return <BrowserRouter>
      <div className={this.getMainClass()}>
        <MuiPickersUtilsProvider utils={MomentUtils}>
          <MuiThemeProvider theme={theme}>
            <header className="App-header">
              <Suspense fallback={<div>Loading...</div>}>
                <Route exact path="/" component={VoteListRoute} />
                <Route exact path="/vote/:voteId" component={VoteRoute} />
                <Route exact path="/vote/:voteId/ballots" component={VoteBallotsRoute} />
                <Route exact path="/admin/make-vote" component={MakeVoteRoute} />
              </Suspense>
            </header>
          </MuiThemeProvider>
        </MuiPickersUtilsProvider>
      </div>
    </BrowserRouter>;
  }
}

type VoteListRouteState = {
  active: VoteAndBallots[];
  past: Vote[];
};

class VoteListRoute extends FetchedStateComponent<{ match: any }, VoteListRouteState> {
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
      <Typography variant="h2">Active Votes</Typography>
      <VoteList votes={data.active} />
      <Typography variant="h2">Closed Votes</Typography>
      <VoteList votes={data.past.map(vote => ({ vote, ballots: [] }))} />
    </div>;
  }
}

type VoteRouteState = {
  vote?: VoteAndBallots;
  ballotCast?: boolean;
  ballotId?: string;
};

class VoteRoute extends FetchedStateComponent<{ match: any, history: any }, VoteRouteState> {
  async fetchState(): Promise<VoteRouteState> {
    let data = await apiClient.getVote(this.props.match.params.voteId);
    return { vote: data, ballotCast: false };
  }

  async onCastBallot(vote: Vote, ballot: Ballot) {
    this.setState({ hasConnected: true, data: { ...this.state.data, ballotCast: true } });
    let response = await apiClient.castBallot(vote.id, ballot);
    if ('error' in response) {
      this.setState({ hasConnected: true, error: response.error });
    } else {
      this.setState({ hasConnected: true, data: { ballotId: response.ballotId, ballotCast: true } });
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
      return <VotePage voteAndBallots={data.vote} ballotCast={data.ballotCast} onCastBallot={this.onCastBallot.bind(this)} />;
    } else {
      return <VoteConfirmationPage ballotId={data.ballotId!} />;
    }
  }
}

class VoteBallotsRoute extends FetchedStateComponent<{ match: any, history: any }, VoteAndBallots | undefined> {
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

type MakeVoteRouteState = {
  phase: "scraping-cfc" | "editing" | "submitted",
  draftVote?: Vote,
  createdVote?: Vote
};

class MakeVoteRoute extends FetchedStateComponent<{ history: any }, MakeVoteRouteState> {
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
      let vote = await apiClient.admin.createVote(proposal);
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

  onChangeCfcUrl(url: string): Promise<Vote> {
    return apiClient.admin.scrapeCfc(url);
  }

  renderState(data: MakeVoteRouteState): JSX.Element {
    if (data.phase === "scraping-cfc") {
      return <ScrapeCFCPage onSubmitDraft={this.onSubmitDraft.bind(this)} onChangePostUrl={this.onChangeCfcUrl.bind(this)} />;
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

export default App;
