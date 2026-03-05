import React, { useEffect, useState } from 'react';
import { fetchTopLeaders } from './supabaseClient';

function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTopLeaders();
        if (!cancelled) {
          setLeaders(data);
        }
      } catch (e) {
        console.error('fetchTopLeaders failed', e);
        if (!cancelled) {
          setError('Unable to load leaders right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="leaderboard">
        <h2 className="leaderboard-title">World Leaders 🏆🏅🎖️</h2>
        <p className="leaderboard-subtitle">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard">
        <h2 className="leaderboard-title">World Leaders 🏆🏅🎖️</h2>
        <p className="leaderboard-subtitle">{error}</p>
      </div>
    );
  }

  if (!leaders.length) {
    return (
      <div className="leaderboard">
        <h2 className="leaderboard-title">World Leaders 🏆🏅🎖️</h2>
        <p className="leaderboard-subtitle">No leaders yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h2 className="leaderboard-title">World Leaders 🏆🏅🎖️</h2>
      <ol className="leaderboard-list">
        {leaders.map((entry, index) => (
          <li key={entry.id ?? index} className="leaderboard-item">
            <span className="leader-rank">{index + 1}.</span>
            <span className="leader-name">{entry.name}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default Leaderboard;
