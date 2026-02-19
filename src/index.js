import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import AuthPage from './AuthPage';
import KinetiCore from './kineticore';

function App() {
  const [user, setUser] = useState(null); // null = not logged in

  const handleEnter = (userData) => setUser(userData);
  const handleLogout = () => setUser(null);

  return user
    ? <KinetiCore user={user} onLogout={handleLogout} />
    : <AuthPage onEnter={handleEnter} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);