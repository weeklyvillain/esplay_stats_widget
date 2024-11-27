import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import './WidgetPage.css';

function WidgetPage() {
  const location = useLocation();
  const { username: urlUsername } = useParams();  // Grab the dynamic username from URL
  const [stats, setStats] = useState(null);
  const [username, setUsername] = useState(urlUsername);

  useEffect(() => {
    const fetchStats = async () => {
      let statsData = location.state?.stats;

      // Try to load stats from state or localStorage first
      if (!statsData) {
        const storedStats = localStorage.getItem('userStats');
        if (storedStats) {
          statsData = JSON.parse(storedStats);
        }
      }

      // If no stats from state or localStorage, fetch from the backend server
      if (!statsData) {
        try {
          const response = await fetch(`http://akkeoh.com:5000/stats/${urlUsername}`);
          if (response.ok) {
            statsData = await response.json();
          } else {
            setStats(null);  // Stats not found, handle error
            return;
          }
        } catch (error) {
          console.error("Error fetching stats:", error);
          setStats(null);  // Failed to fetch, handle error
          return;
        }
      }

      // Once stats are fetched, update the state
      if (statsData) {
        setStats(statsData);
        setUsername(urlUsername);  // Ensure username is updated
      }
    };

    // Run the fetchStats function when the username (URL param) changes
    fetchStats();

  }, [urlUsername, location.state]);  // Dependency on urlUsername, re-run on username change

  // If stats are still loading or missing, show an error message
  if (!stats || !stats.game_stats || !stats.cs_fields) {
    return <div>Error: Missing necessary stats data.</div>;
  }

  // Extract stats for display
  const winStreak = stats.game_stats.win_streak;
  const KD = stats.cs_fields.kills && stats.cs_fields.deaths ? (stats.cs_fields.kills / stats.cs_fields.deaths).toFixed(2) : "N/A";
  const winPercentage = stats.game_stats.matches > 0 ? ((stats.game_stats.wins / stats.game_stats.matches) * 100).toFixed(0) : "N/A";
  const HSPercentage = stats.cs_fields.kills > 0 ? ((stats.cs_fields.headshots / stats.cs_fields.kills) * 100).toFixed(0) : "N/A";
  const ADR = stats.cs_fields.rounds > 0 ? (stats.cs_fields.damage_dealt / stats.cs_fields.rounds).toFixed(2) : "N/A";

  // Determine elo image based on user's elo rating
  let eloImage = "";
  const elo = stats.game_stats.elo;
  if (elo >= 2300) {
    eloImage = "global.png";
  } else if (elo >= 2100) {
    eloImage = "elite_3.png";
  } else if (elo >= 2000) {
    eloImage = "elite_2.png";
  } else if (elo >= 1900) {
    eloImage = "elite_1.png";
  } else if (elo >= 1700) {
    eloImage = "diamond_3.png";
  } else if (elo >= 1600) {
    eloImage = "diamond_2.png";
  } else if (elo >= 1500) {
    eloImage = "diamond_1.png";
  } else if (elo >= 1300) {
    eloImage = "gold_3.png";
  } else if (elo >= 1200) {
    eloImage = "gold_2.png";
  } else if (elo >= 1100) {
    eloImage = "gold_1.png";
  } else if (elo >= 1000) {
    eloImage = "silver_2.png";
  } else {
    eloImage = "silver_1.png";
  }

  // Determine win streak image based on the current streak
  let winStreakImage = "";
  if (winStreak > 0) {
    if (winStreak > 5) {
      winStreakImage = "x5.png";
    } else {
      winStreakImage = `x${winStreak}.png`;
    }
  }

  return (
    <div className="widget-page">
      <div className="widget-content">
        <div className="rank-column">
          <img src={`/images/elo/${eloImage}`} alt={eloImage} className="elo-image" />
        </div>
        <div className="info-column">
          <div className="username-elo">
            <div className="username">
              <h2>{username}</h2>
            </div>
            <div className="elo">
              <p>Elo: {elo}</p>
            </div>
          </div>
          <div className="stats-grid">
            <div className="stats-column">
              <p>K/D: {KD}</p>
              <p>ADR: {ADR}</p>
            </div>
            <div className="stats-column">
              <p>Win %: {winPercentage}%</p>
              <p>HS %: {HSPercentage}%</p>
            </div>
          </div>
        </div>
        {winStreakImage && <div className="win-streak-image">
          <img src={`/images/win_streak/${winStreakImage}`} alt="Win Streak" />
        </div>}
      </div>
    </div>
  );
}

export default WidgetPage;
