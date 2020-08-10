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
    type: { kind: "rate-options", min: 1, max: 5 },
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
      <header className="App-header">
        <VoteCard voteAndBallots={mockVoteAndBallots} />
      </header>
    </div>
  );
}

export default App;
