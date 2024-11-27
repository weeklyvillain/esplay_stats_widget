import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import WidgetPage from './components/WidgetPage';

function App() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize navigate

  // Handle input change for username
  const handleInputChange = (event) => {
    setUsername(event.target.value);
  };

  // Function to fetch data and refresh stats
  const fetchData = async () => {
    if (!username) {
      setError("Please enter a valid username.");
      return;
    }
    setError(null); // Reset previous error

    const apiUrl = `https://esplay.com/api/profile/get?username=${username}&teams=1&friends=1&header=1&followers=1&medals=1&game_stats=1&game_id=1&level_history=1&clips=1&twitch=1&steam=1&spaces=1&username_history=1&item_drops=1`;

    try {
      // Fetch data using CORS proxy
      const response = await axios.get(
        `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`
      );

      const jsonData = JSON.parse(response.data.contents);

      // Save the data in localStorage
      localStorage.setItem('userStats', JSON.stringify(jsonData));

      // Save the data to the server
      await saveDataToServer(jsonData);

      // Use navigate() to redirect to the widget page
      navigate(`/widget/${username}`, { state: { stats: jsonData, username: username } });

    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Error fetching data");
    }
  };

  // Save the fetched data to the server as a .json file
  const saveDataToServer = async (jsonData) => {
    if (!jsonData) return;

    const stats = {
      game_stats: jsonData.game_stats,
      cs_fields: jsonData.cs_fields,
      username: username,
    };

    try {
      await axios.post(`http://akkeoh.com:5000/save-stats`, {
        username: username,
        stats: stats,
      });
    } catch (error) {
      console.error("Error saving data", error);
      setError("Error saving data.");
    }
  };

  return (
    <div className="App">
      <h1>Fetch and Save Stats</h1>
      <input
        type="text"
        value={username}
        onChange={handleInputChange}
        placeholder="Enter Username"
      />
      <button onClick={fetchData}>Fetch Data</button>

      {error && <p>{error}</p>}
    </div>
  );
}

// Set up routing for the app
function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/widget/:username" element={<WidgetPage />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
