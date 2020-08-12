import React, { Component, Suspense } from 'react';
import './App.css';
import { VoteAndBallots } from './model/vote';
import { Route, BrowserRouter } from 'react-router-dom';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { green } from '@material-ui/core/colors';
import VoteList from './components/vote-list';
import { Typography } from '@material-ui/core';
import { DummyAPIClient } from './model/dummy-api-client';
import ErrorPage from './components/error-page';
import VotePage from './components/vote-page';

let mockVoteAndBallots: VoteAndBallots = {
  vote: {
    id: "mock-vote",
    name: "24th Ballot Initiative",
    description: "We will now vote on **something.**",
    isActive: true,
    type: { kind: "choose-one" },
    options: [
      {
        id: "option-1",
        name: "Yes",
        description: "Approve the proposed proposal as proposed by someone at some point, probably."
      },
      {
        id: "option-2",
        name: "No",
        description: "Wow such option two"
      }
    ]
  },
  ownBallot: {
    selectedOptionId: "option-1"
  },
  ballots: []
};

let mockVoteAndBallots2: VoteAndBallots = {
  vote: {
    id: "mock-vote-2",
    name: "44th Presidential Election",
    description: "We will now vote on **something.**",
    isActive: true,
    type: { kind: "rate-options", min: 1, max: 5 },
    options: [
      {
        id: "option-1",
        name: "Ronald McDonald",
        description: "Free burgers for everyone."
      },
      {
        id: "option-2",
        name: "Scrooge McDuck",
        description: "Elect me and I'll make you rich!"
      }
    ]
  },
  ballots: []
};

let activeVotes = [mockVoteAndBallots, mockVoteAndBallots2];

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
const authenticator = apiClient.getAuthenticator();

class App extends Component<{}, { hasConnected: boolean, isAuthenticated: boolean, error?: any }> {
  constructor(props: {}) {
    super(props);
    this.state = {
      hasConnected: false,
      isAuthenticated: false
    };
  }

  componentDidMount() {
    // Check if we're authenticated. Update state accordingly.
    // TODO: handle network errors.
    authenticator.isAuthenticated()
      .then(
        val => this.setState({ hasConnected: true, isAuthenticated: val }),
        reason => this.setState({ hasConnected: false, isAuthenticated: false, error: reason }));
  }

  getMainClass(): string {
    return ["App", ...currentSeasons].join(" ");
  }

  render() {
    if (!this.state.hasConnected) {
      return <div className={this.getMainClass()}>
        <header className="App-header">
          {this.state.error
            ? <ErrorPage error={this.state.error} />
            : []}
        </header>
      </div>;
    }

    if (!this.state.isAuthenticated) {
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
        <MuiThemeProvider theme={theme}>
          {/* <div className="App-body">
            <Suspense fallback={<div>Loading...</div>}>
              <Route exact={true} path="/" render={routeProps => <FilterableSpellbook key="spellbook" spells={this.state.allSpells}/>} />
              <Route path="/spell/:spellId" render={routeProps => <SpellRoute {...routeProps} allSpells={this.state.allSpells}/>} />
              <Route path="/linter" render={routeProps => <LinterRoute {...routeProps} allSpells={this.state.allSpells}/>} />
            </Suspense>
          </div> */}
          <header className="App-header">
            <Suspense fallback={<div>Loading...</div>}>
              <Route exact={true} path="/" render={routeProps => <VoteListRoute {...routeProps} allVotes={activeVotes} />} />
              <Route path="/vote/:voteId" render={routeProps => <VoteRoute {...routeProps} allVotes={activeVotes} />} />
            </Suspense>
          </header>
        </MuiThemeProvider>
      </div>
    </BrowserRouter>;
  }
}

class VoteListRoute extends Component<{ match: any, allVotes: VoteAndBallots[] }, any> {
  render() {
    if (this.props.allVotes.length === 0) {
      return <div></div>;
    }
    return <div>
      <Typography variant="h2">Active Votes</Typography>
      <VoteList votes={this.props.allVotes} />
    </div>;
  }
}

class VoteRoute extends Component<{ match: any, allVotes: VoteAndBallots[] }, any> {
  render() {
    if (this.props.allVotes.length === 0) {
      return <div></div>;
    }
    let voteId = this.props.match.params.voteId;
    let vote = this.props.allVotes.find(val => val.vote.id === voteId);
    if (vote) {
      return <VotePage voteAndBallots={vote} />
    } else {
      return <div>
        <h1>Error 404</h1>
        Vote with ID '{voteId}' not found.
      </div>;
    }
  }
}

export default App;
