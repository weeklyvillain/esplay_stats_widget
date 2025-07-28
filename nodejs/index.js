const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const port = 5000;

// Array of allowed origins (you can add more if needed)
const allowedOrigins = ['http://localhost:3000', 'http://akkeoh.com:3000'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests from the allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true); // Allow the request
      } else {
        callback(new Error('Not allowed by CORS'), false); // Reject the request
      }
    },
  })
);

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Proxy route to forward requests to the external API (if needed)
app.get("/proxy-api", async (req, res) => {
  const { username } = req.query;
  const apiUrl = `https://esplay.com/api/profile/get?username=${username}&teams=1&friends=1&header=1&followers=1&medals=1&game_stats=1&game_id=1&level_history=1&clips=1&twitch=1&steam=1&spaces=1&username_history=1&item_drops=1`;

  try {
    const response = await axios.get(apiUrl);
    res.json(response.data); // Send the data from esplay.com API to the React app
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data from the API");
  }
});


// Route to serve stats data from JSON files in the private 'stats' folder
app.get("/stats/:username", async (req, res) => {
  const { username } = req.params;
  const filePath = path.join(__dirname, 'stats', `${username}.json`);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Stats file for user ${username} not found. Fetching from API and saving...`);
    const apiUrl = `https://esplay.com/api/profile/get?username=${username}&teams=1&friends=1&header=1&followers=1&medals=1&game_stats=1&game_id=1&level_history=1&clips=1&twitch=1&steam=1&spaces=1&username_history=1&item_drops=1`;
    const response = await fetch(
      apiUrl,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) {
      console.error("Error fetching data from API:", response.statusText);
      return res.status(500).send("Error fetching data from the API.");
    }
    const jsonData = await response.json();
    // Save the fetched data to the file
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
    console.log(`Fetched and saved data for user: ${username}`);
  }

  res.sendFile(filePath); // Serve the file directly
});

// Function to refresh stats for all users in the 'stats' folder
const refreshStats = async () => {
  const statsDir = path.join(__dirname, 'stats');
  
  // Read all files in the stats directory
  fs.readdir(statsDir, async (err, files) => {
    if (err) {
      console.error("Error reading stats directory:", err);
      return;
    }

    // Iterate over each file in the directory
    for (const file of files) {
      if (file.endsWith('.json')) {
        const username = path.basename(file, '.json');
        const apiUrl = `https://esplay.com/api/profile/get?username=${username}&teams=1&friends=1&header=1&followers=1&medals=1&game_stats=1&game_id=1&level_history=1&clips=1&twitch=1&steam=1&spaces=1&username_history=1&item_drops=1`;

        try {
          // Fetch the latest data for the user from the external API
          const response = await axios.get(apiUrl);
          const stats = response.data;

          // Save the new stats data to the file
          const filePath = path.join(statsDir, `${username}.json`);
          fs.writeFile(filePath, JSON.stringify(stats, null, 2), (err) => {
            if (err) {
              console.error(`Error saving data for user: ${username}`, err);
            } else {
              // This is where the output will go to the cmd console
              const timestamp = new Date().toISOString();
              console.log(`[${timestamp}] Json autoupdated for user: ${username}`);
            }
          });
        } catch (error) {
          console.error(`Error fetching data for user: ${username}`, error);
        }
      }
    }
  });
};


// Set up the interval to refresh stats every 3 minutes (180,000 ms)
setInterval(refreshStats, 180000); // Every 3 minutes

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));
