const express = require('express');
const path = require('path');
const app = express();

// Ensure static files are served from the correct directory
app.use(express.static(path.join(__dirname)));

// Serve index.html for the root URL and all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Listen on the specified port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});