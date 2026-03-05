import React, { useEffect, useMemo, useState } from 'react';
import countries from './data/countries.json';
import { checkIfWorldLeader, submitLeader } from './supabaseClient';


// sound helpers
const soundCache = {};
let backgroundMusic = null;

const playSound = (fileName, volume = 0.4) => {
  if (!soundCache[fileName]) {
    soundCache[fileName] = new Audio(`/sounds/${fileName}`);
  }
  const audio = soundCache[fileName];
  audio.pause();
  audio.currentTime = 0;
  audio.volume = volume;
  audio.play().catch(() => {});
};

const stopAllSounds = () => {
  Object.values(soundCache).forEach((audio) => {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {}
  });

  if (backgroundMusic) {
    try {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    } catch {}
  }
};

const playCorrectSound   = () => playSound('ding.mp3', 0.2);
const playWrongSound     = () => playSound('buzzer.mp3', 0.4);
const playPassSound      = () => playSound('swish.mp3', 0.4);
const playFinishSound    = () => playSound('happydance.mp3', 0.3);
const playCountdownSound = () => playSound('countdown.mp3', 0.4);
const playStartDing      = () => playSound('ding.mp3', 0.2);
const playClickSound     = () => playSound('click.mp3', 0.3);
const playTallySound      = () => playSound('countdown.mp3', 0.4); // reuse countdown
const playLeaderCheer     = () => playSound('cheering.mp3', 0.4);

const startBackgroundMusic = () => {
  if (!backgroundMusic) {
    backgroundMusic = new Audio('/sounds/concentrate.mp3');
    backgroundMusic.loop = true;
  }
  backgroundMusic.volume = 0.2; // adjust to taste
  backgroundMusic.play().catch(() => {});
};

const stopBackgroundMusic = () => {
  if (!backgroundMusic) return;
  try {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  } catch {}
};

const GAME_DURATION_MS = 5_000; // <seconds>_000

function CountdownMode({ onExit, onExitFromHeader }) {
  const [resultsPhase, setResultsPhase] = useState('idle'); 
  // 'idle' | 'tallying' | 'done'
  const [remainingMs, setRemainingMs] = useState(GAME_DURATION_MS);
  const [hasFinishedSoundPlayed, setHasFinishedSoundPlayed] = useState(false);
  const [hasTalliedThisGame, setHasTalliedThisGame] = useState(false);
  const [currentCountry, setCurrentCountry] = useState(null);
  const [usedCountryIds, setUsedCountryIds] = useState([]);
  const [score, setScore] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [wrongGuessesForCurrent, setWrongGuessesForCurrent] = useState([]);
  const [lastResult, setLastResult] = useState(null); // 'correct' | 'wrong' | 'pass' | null
  const [resultBanner, setResultBanner] = useState(null); // 'correct' | 'wrong' | 'pass' | null

  const [isWorldLeader, setIsWorldLeader] = useState(false);
const [hasCheckedLeader, setHasCheckedLeader] = useState(false);
const [playerName, setPlayerName] = useState('');

const [phase, setPhase] = useState('idle'); // 'idle' | 'precount' | 'playing' | 'finished'
const [shuffleCountry, setShuffleCountry] = useState(null);
const [precountMs, setPrecountMs] = useState(0);

useEffect(() => {
return () => {
stopAllSounds();
};
}, []);

useEffect(() => {
  if (!resultBanner) return;

  const timeoutId = setTimeout(() => {
    setResultBanner(null);
  }, 2000); // 2 seconds

  return () => clearTimeout(timeoutId);
}, [resultBanner]);


  // Precompute remaining pool (no repeats in one game)
  const remainingCountries = useMemo(() => {
    return countries.filter((c) => !usedCountryIds.includes(c.id));
  }, [usedCountryIds]);

  // Timer
  useEffect(() => {
  if (phase !== 'playing') return;

  const start = performance.now();
  let previous = start;
  let frameId;

  const tick = (now) => {
    const delta = now - previous;
    previous = now;

    setRemainingMs((prev) => {
      const next = prev - delta;
      if (next <= 0) {
        setPhase('finished');
        return 0;
      }
      return next;
    });

    frameId = requestAnimationFrame(tick);
  };

  frameId = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(frameId);
}, [phase]);

useEffect(() => {
  if (phase !== 'precount') return;

  playCountdownSound();

  const start = performance.now();
  let frameId;

  const tick = (now) => {
    const elapsed = now - start;
    setPrecountMs(elapsed);

    if (elapsed >= 3000) {
      playStartDing();
      setPhase('playing');
      return;
    }
    frameId = requestAnimationFrame(tick);
  };

  frameId = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(frameId);
}, [phase]);


useEffect(() => {
  if (phase === 'idle') {
    handleStart();
  }
}, [phase]); 

useEffect(() => {
  if (phase === 'playing') {
    startBackgroundMusic();
  }

  if (phase === 'finished') {
    stopBackgroundMusic();
  }
}, [phase]);


// Shuffle countries rapidly during precount
useEffect(() => {
  if (phase !== 'precount') return;

  let frameId;
  const SHUFFLE_INTERVAL = 80; // ms
  let last = performance.now();

  const tick = (now) => {
    if (now - last >= SHUFFLE_INTERVAL) {
      last = now;
      const next = pickRandomCountry(countries, []);
      setShuffleCountry(next || null);
    }
    frameId = requestAnimationFrame(tick);
  };

  frameId = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(frameId);
}, [phase]);

useEffect(() => {
  if (phase === 'playing' && !currentCountry) {
    const next = pickRandomCountry(countries, usedCountryIds);
    if (next) {
      setCurrentCountry(next);
    } else {
      setPhase('finished');
    }
  }
}, [phase, currentCountry, usedCountryIds]);

  const pickRandomCountry = (pool, excludeIds) => {
    const available = pool.filter((c) => !excludeIds.includes(c.id));
    if (available.length === 0) return null;
    const index = Math.floor(Math.random() * available.length);
    return available[index];
  };

  // Start game
const handleStart = () => {
  stopAllSounds();
  setRemainingMs(GAME_DURATION_MS);
  setHasFinishedSoundPlayed(false);
  setHasTalliedThisGame(false);   // <-- add this
  setUsedCountryIds([]);
  setScore(0);
  setSearchTerm('');
  setWrongGuessesForCurrent([]);
  setLastResult(null);
  setPhase('precount');
};


  const handleNextCountry = (passed = false) => {
    if (!currentCountry) return;
    const newUsed = [...usedCountryIds, currentCountry.id];
    setUsedCountryIds(newUsed);
    setWrongGuessesForCurrent([]);
    setSearchTerm('');

    const next = pickRandomCountry(countries, newUsed);
        if (!next) {
      // No more countries; end early
      setPhase('finished');
      if (passed) {
        setLastResult('pass');
      }
      return;
    }

    setCurrentCountry(next);
  };

  const filteredOptions = useMemo(() => {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return [];

  return countries
    .filter((c) => c.name.toLowerCase().includes(term))
    .sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      const aStarts = aName.startsWith(term);
      const bStarts = bName.startsWith(term);

      // 1) Prioritize names that start with the term
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // 2) Otherwise, sort alphabetically
      return aName.localeCompare(bName, 'en');
    })
    .slice(0, 5);
}, [searchTerm]);

  const handleOptionClick = (countryId) => {
    if (!currentCountry || phase !== 'playing') return;

if (countryId === currentCountry.id) {
  // Correct
  playCorrectSound();
  setScore((s) => s + 1);
  setLastResult('correct');
  setResultBanner('correct');
  handleNextCountry(false);
} else {
  // Wrong
  if (!wrongGuessesForCurrent.includes(countryId)) {
    const newWrongs = [...wrongGuessesForCurrent, countryId];
    setWrongGuessesForCurrent(newWrongs);

    if (newWrongs.length >= 3) {
      // Third wrong guess triggers wrong + pass
      playPassSound();
      setLastResult('pass');
      setResultBanner('pass');
      handleNextCountry(true);
    } else {
      playWrongSound();
      setLastResult('wrong');
      setResultBanner('wrong');
    }
  }
}

  };

  // Format timer: seconds.hundredths
  const seconds = Math.floor(remainingMs / 1000);
  const hundredths = Math.floor((remainingMs % 1000) / 10)
    .toString()
    .padStart(2, '0');

  const isGameOver = phase === 'finished';

  // NEW: choose canvas style based on phase
const canvasStateClass =
  phase === 'precount'
    ? 'canvas-precount'
    : isGameOver
    ? 'canvas-gameover'
    : 'canvas-with-shadow';

    let precountNumber = null;
if (phase === 'precount') {
  const clamped = Math.min(Math.max(precountMs, 0), 3000);
  const step = Math.floor(clamped / 1000); // 0,1,2,3
  const value = 3 - step;                 // 3,2,1,0
  precountNumber = value > 0 ? value : 1; // hold at 1 on last beat
}

useEffect(() => {
  if (phase !== 'finished') return;

  stopAllSounds();
  setResultsPhase('tallying');
  setHasCheckedLeader(false);
  setIsWorldLeader(false);
  setPlayerName('');

  const timeoutId = setTimeout(async () => {
  if (phase !== 'finished') return;

  let madeBoard = false;
  try {
    madeBoard = await checkIfWorldLeader(score);  // async check against Supabase
  } catch (e) {
    console.error('checkIfWorldLeader failed', e);
  }

  setIsWorldLeader(madeBoard);
  setHasCheckedLeader(true);
  setResultsPhase('done');

  if (madeBoard) {
    playLeaderCheer();
    setTimeout(() => {
      if (phase !== 'finished') return;
      playFinishSound();
    }, 4500);
  } else {
    playFinishSound();
  }
}, 2000);

  return () => clearTimeout(timeoutId);
}, [phase, score, hasFinishedSoundPlayed]);



return (
  <div className="mode-root">
    <header className="countdown-header">
      <div className="timer">
        <span className="timer-label">TIME LEFT</span>
        <div className="timer-digits">
          <span className="timer-block">
            {String(seconds).padStart(2, '0')[0]}
          </span>
          <span className="timer-block">
            {String(seconds).padStart(2, '0')[1]}
          </span>
          <span className="timer-separator">:</span>
          <span className="timer-block">{hundredths[0]}</span>
          <span className="timer-block">{hundredths[1]}</span>
        </div>
      </div>
      <div className="score-pill">
        Score: {score}
      </div>
    </header>

    <div className="countdown-layout">
      <div className={`canvas ${canvasStateClass}`}>
        {phase === 'precount' && shuffleCountry && shuffleCountry.svgPath && (
          <img
            src={shuffleCountry.svgPath}
            alt={shuffleCountry.name}
            className="country-image"
          />
        )}

        {phase === 'precount' && (
          <>
            <div className="precount-overlay" />
            <span className="precount-number">
              {precountNumber ?? 3}
            </span>
          </>
        )}

        {!isGameOver && phase === 'playing' && currentCountry && (
          currentCountry.svgPath ? (
            <img
              src={currentCountry.svgPath}
              alt={currentCountry.name}
              className="country-image"
            />
          ) : (
            <div className="country-placeholder">
              {currentCountry.name}
            </div>
          )
        )}

        {isGameOver && (
  <div className="game-over-in-canvas">
    {resultsPhase === 'tallying' && (
       <>
        <div className="game-over-emoji">⏳</div>
        <p className="leader-status-tally">Checking score…</p>
      </>
    )}

    {resultsPhase === 'done' && (
      <>
        <div className="game-over-emoji">
          {isWorldLeader ? "🏆" : "🤷‍♀️"}
        </div>

        <p className="leader-status">
          {isWorldLeader
            ? "Congratulations! You're a World Leader — enter your name:"
            : "Sorry, you didn't make World Leader"}
        </p>

        <div className="game-over-buttons">
          {!isWorldLeader && (
            <>
              <button
                className="pill-button secondary-pill"
                onClick={() => {
                  stopAllSounds();
                  playClickSound();
                  onExit();
                }}
              >
                « Exit
              </button>
              <button
                className="pill-button primary-pill"
                onClick={() => {
                  stopAllSounds();
                  playClickSound();
                  handleStart();
                }}
              >
                Play again »
              </button>
            </>
          )}

          {isWorldLeader && (
            <>
              <input
                type="text"
                className="leader-name-input"
                placeholder="Your Name"
                value={playerName}
                maxLength={15}
                onChange={(e) => setPlayerName(e.target.value)}
              />

              <button
                className="pill-button primary-pill"
                onClick={async () => {
                  stopAllSounds();
                  playClickSound();

                  try {
                    await submitLeader(playerName.trim(), score);
                  } catch (e) {
                    console.error('submitLeader failed', e);
                  }

                  onExit('start');
                }}
                disabled={!playerName.trim()}
              >
                Submit »
              </button>
            </>
          )}
        </div>
      </>
    )}
  </div>
)}


      </div>

      {/* search panel + result banner stay below here */}
      {phase === 'playing' && (
        <>
          <div className="search-panel">
            <input
              type="text"
              className="search-input"
              placeholder="Start typing a country name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ul className="options-list">
              {filteredOptions.map((option) => {
                const isDisabled = wrongGuessesForCurrent.includes(option.id);
                return (
                  <li key={option.id}>
                    <button
                      className={`option-button ${
                        isDisabled ? 'option-disabled' : ''
                      }`}
                      onClick={() => {
                        if (isDisabled) return;
                        handleOptionClick(option.id);
                      }}
                      disabled={isDisabled}
                    >
                      {option.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {resultBanner && (
  <div className={`result-banner result-${resultBanner}`}>
    {resultBanner === 'correct' && 'CORRECT!'}
    {resultBanner === 'wrong' && 'WRONG!'}
    {resultBanner === 'pass' && 'PASS'}
  </div>
)}

        </>
      )}
    </div>
  </div>
);

}

export default CountdownMode;
