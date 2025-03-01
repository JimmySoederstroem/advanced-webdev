import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  const handleClick = () => {
    setCount(count + 1);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div style={{
      backgroundColor: darkMode ? 'black' : 'white',
      color: darkMode ? 'white' : 'black',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1>Welcome to my page! You have clicked the button {count} times.</h1>
      <button style={{
        margin: '10px',
        padding: '10px',
        fontSize: '16px'
      }} onClick={handleClick}>Click me</button>
      <button style={{
        margin: '10px',
        padding: '10px',
        fontSize: '16px'
      }} onClick={toggleDarkMode}>
        Switch to {darkMode ? 'Light' : 'Dark'} Mode
      </button>
    </div>
  );
}

export default App;