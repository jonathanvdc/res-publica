import React, { Component, Suspense } from 'react';
import logo from './logo.svg';
import './App.css';
import VoteCard from './components/vote-card';
import { VoteAndBallots } from './model/vote';
import { HashRouter, Route } from 'react-router-dom';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { green } from '@material-ui/core/colors';
import VoteList from './components/vote-list';

let mockVoteAndBallots: VoteAndBallots = {
  vote: {
    id: "mock-vote",
    name: "44th Presidential Election",
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
  ballots: []
};

let mockVoteAndBallots2: VoteAndBallots = {
  vote: {
    id: "mock-vote-2",
    name: "42nd Ballot Initiative",
    description: "We will now vote on **something.**",
    isActive: true,
    type: { kind: "rate-options", min: 1, max: 5 },
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
  ballots: []
};

let allVotes = [mockVoteAndBallots, mockVoteAndBallots2];

let currentSeasons: string[] = [];

function getMainClass(): string {
  return ["App", ...currentSeasons].join(" ");
}

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: green
  },
});

function App() {
  return <HashRouter>
    <div className={getMainClass()}>
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
            <Route exact={true} path="/" render={routeProps => <VoteList {...routeProps} votes={allVotes} />} />
            <Route path="/vote/:voteId" render={routeProps => <VoteRoute {...routeProps} allVotes={allVotes} />} />
          </Suspense>
        </header>
      </MuiThemeProvider>
    </div>
  </HashRouter>;
}

class VoteRoute extends Component<{ match: any, allVotes: VoteAndBallots[] }, any> {
  render() {
    if (this.props.allVotes.length === 0) {
      return <div></div>;
    }
    let voteId = this.props.match.params.voteId;
    let vote = this.props.allVotes.find(val => val.vote.id === voteId);
    if (vote) {
      return <VoteCard voteAndBallots={vote} />
    } else {
      return <div>
        <h1>Error 404</h1>
        Vote with ID '{voteId}' not found.
      </div>;
    }
  }
}

export default App;
