import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import AuthPage from './AuthPage';
import KinetiCore from './kineticore';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  // Show auth page first, then main app after login
  return loggedIn
    ? <KinetiCore />
    : <AuthPage onEnter={() => setLoggedIn(true)} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);