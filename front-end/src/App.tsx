import React from 'react';
import logo from './logo.svg';
import './App.css';
import VoteCard from './components/vote-card';
import { VoteAndBallots } from './model/vote';

let mockVoteAndBallots: VoteAndBallots = {
  vote: {
    id: "mock-vote",
    name: "Mock Vote",
    description: "We will now vote on **something.**",
    isActive: true,
    type: { kind: "choose-one" },
    options: [
      {
        id: "option-1",
        name: "Option One",
        description: "Wow such option"
      },
      {
        id: "option-2",
        name: "Option Two",
        description: "Wow such option two"
      }
    ]
  },
  ballots: []
};

function App() {
  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      <VoteCard voteAndBallots={mockVoteAndBallots} />
    </div>
  );
}

export default App;
