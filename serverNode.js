// Import the built-in http and fs modules
const http = require('http');
const fs = require('fs');
const path = require('path');

// Define a port to listen on
const port = 3000;

// Create a server
const server = http.createServer((req, res) => {
  // Parse the request URL
  const filePath = path.join(__dirname, 'index-combined.html');

  // Read the HTML file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Internal Server Error\n');
      return;
    }

    // Set the response HTTP header with HTTP status and Content type
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(data);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});