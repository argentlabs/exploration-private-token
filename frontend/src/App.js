import React from 'react';
import StarknetApp from './components/StarknetApp';
import './App.css';

function App() {
  return (
    <div className="App" style={{
      minHeight: '100vh',
      background: '#f3f4f6',
      padding: '1rem'
    }}>
      <StarknetApp />
    </div>
  );
}

export default App;