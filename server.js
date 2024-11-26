const express = require('express');
const path = require('path');
const app = express();

// Improved logging
console.log('Current directory:', __dirname);
console.log('Static files will be served from:', path.join(__dirname));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).send('Something went wrong!');
});

// Catch-all route to serve index.html
app.get('*', (req, res) => {
  console.log('Serving index.html');
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Error loading index.html');
    }
  });
});

// Listen on the specified port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}).on('error', (error) => {
  console.error('Server start error:', error);
});