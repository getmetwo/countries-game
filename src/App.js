import React, { useState } from 'react';
import './index.css';
import CountdownMode from './CountdownMode';
import Leaderboard from './Leaderboard';


const playClick = () => {
const audio = new Audio('/sounds/click.mp3');
audio.volume = 0.4;
audio.play().catch(() => {});
};

function App() {
  const [mode, setMode] = useState(null);
  console.log('App rendered on Vercel'); // TEMP
  const handleSelectMode = (selectedMode) => {
    setMode(selectedMode);
  };

// Game mode: Countdown
if (mode === 'countdown') {
  return (
    <div className="app-root mode-root-white">
      <header className="app-header mode-header-white">
        <button
  className="back-button-simple"
  onClick={() => {
    playClick();
    setMode(null);   // go straight back home
  }}
>
  « exit
</button>

        <div className="mode-header-text">
          <h1 className="mode-title">⏳</h1>
          <p className="mode-subtitle">
            Name as many countries as you can<br />(3 wrong guesses = pass)
          </p>
        </div>
      </header>

      <CountdownMode
  onExit={() => {
    setMode(null);   // always return home for now
  }}
/>

    </div>
  );
}


// Home screen
return (
  <div className="app-root home-root">
    <header className="home-header">
      <h1 className="home-title">COUNTRIES GAME</h1>
      <p className="home-subtitle">
        How many countries can you recognize just from their shape?
      </p>

      <div className="home-cta">
  <img
    src="/images/logo.svg"
    alt="Countries game logo"
    className="home-logo"
  />
<button
  className="home-play-button"
  onClick={() => handleSelectMode('countdown')}
>
  Play »
</button>

</div>
    </header>

        <main className="home-main home-main-single">
      {/* You can add other home content here later */}
    </main>
    <Leaderboard />

  </div>
);

}

export default App;
