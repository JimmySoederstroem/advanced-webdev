// Import the Express module
const express = require('express');
const path = require('path');
const app = express();

// Define a port to listen on
const port = 3000;

// Serve the index-combined.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index-combined.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});