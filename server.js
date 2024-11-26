const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();

// Extensive logging and file system checks
async function logFileSystemDetails() {
  try {
    console.log('Detailed File System Diagnostics:');
    console.log('Current Working Directory:', process.cwd());
    console.log('__dirname:', __dirname);

    // List files in current directory
    const files = await fs.readdir(process.cwd());
    console.log('Files in current directory:', files);

    // Check specific file existence
    const checkFiles = ['index.html', 'server.js', 'chat-widget.js', 'web.config'];
    for (const file of checkFiles) {
      try {
        await fs.access(path.join(process.cwd(), file));
        console.log(`✓ ${file} exists`);
      } catch {
        console.log(`✗ ${file} does not exist`);
      }
    }
  } catch (error) {
    console.error('Error checking file system:', error);
  }
}

// Middleware for request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static files with comprehensive logging
app.use((req, res, next) => {
  const staticPath = path.join(process.cwd());
  console.log(`Attempting to serve static files from: ${staticPath}`);
  express.static(staticPath)(req, res, next);
});

// Comprehensive route handler
app.get('*', async (req, res) => {
  try {
    const indexPath = path.join(process.cwd(), 'index.html');
    console.log(`Attempting to serve index.html from: ${indexPath}`);

    // Check file existence before sending
    await fs.access(indexPath);
    
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(500).send(`Server error: ${err.message}`);
      } else {
        console.log(`Successfully served index.html for ${req.url}`);
      }
    });
  } catch (error) {
    console.error('Index.html serving error:', error);
    res.status(404).send('File not found');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV !== 'production' ? err.message : {}
  });
});

// Server initialization with logging
const port = process.env.PORT || 8080;

// Log file system details on startup
logFileSystemDetails();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Server start time: ${new Date().toISOString()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});