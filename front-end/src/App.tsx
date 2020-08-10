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

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <VoteCard voteAndBallots={mockVoteAndBallots} />
      </header>
    </div>
  );
}

export default App;
