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

// Route to save data to the server as a .json file
app.post("/save-stats", (req, res) => {
  const { username, stats } = req.body;

  // Define the directory to store the stats files (private folder, not public)
  const statsDir = path.join(__dirname, 'stats'); // Save in private 'stats' folder
  if (!fs.existsSync(statsDir)) {
    fs.mkdirSync(statsDir, { recursive: true }); // Create the folder if it doesn't exist
  }

  // Define the file path to save the stats for the user
  const filePath = path.join(statsDir, `${username}.json`);

  // Check if this is the first request (if file doesn't exist, it's the first request)
  const isFirstRequest = !fs.existsSync(filePath);

  // Log the first request for the user
  if (isFirstRequest) {
    const firstRequestTimestamp = new Date().toISOString();
    console.log(`[${firstRequestTimestamp}] First request for user: ${username}`);
  }

  // Save the stats data as a JSON file
  fs.writeFile(filePath, JSON.stringify(stats, null, 2), (err) => {
    if (err) {
      console.error("Error saving data:", err);
      return res.status(500).send("Error saving data.");
    }

    // Log the update time
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Data updated for user: ${username}`);
    res.send("Data saved successfully.");
  });
});

// Route to serve stats data from JSON files in the private 'stats' folder
app.get("/stats/:username", (req, res) => {
  const { username } = req.params;
  const filePath = path.join(__dirname, 'stats', `${username}.json`);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath); // Serve the file directly
  } else {
    console.log(`Stats file not found for user: ${username}`);
    res.status(404).json({ error: "User stats not found" }); // Respond with a JSON error
  }
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
