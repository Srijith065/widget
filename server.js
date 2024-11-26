const express = require('express');
const path = require('path');
const os = require('os');

const app = express();

// Enhanced logging for diagnostics
console.log('Server Startup Diagnostics:');
console.log('Current Directory:', __dirname);
console.log('Absolute Path to index.html:', path.resolve(__dirname, 'index.html'));
console.log('Files in Directory:', require('fs').readdirSync(__dirname));
console.log('Node Version:', process.version);
console.log('Environment:', process.env.NODE_ENV);

// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

// Serve static files with explicit options
app.use(express.static(__dirname, {
  dotfiles: 'ignore',
  extensions: ['html', 'htm', 'js'],
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.set('Cache-Control', 'no-cache');
    }
  }
}));

// Primary route handler
app.get('*', (req, res) => {
  console.log(`Catch-all route hit for: ${req.url}`);
  
  const indexPath = path.join(__dirname, 'index.html');
  console.log(`Attempting to serve index.html from: ${indexPath}`);
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading index.html');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV !== 'production' ? err.message : {}
  });
});

// Flexible port binding
const port = process.env.PORT || process.env.WEBSITE_PORT || 8080;

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Server accessible at: http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});