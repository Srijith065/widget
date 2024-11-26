const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the root directory (if your files are not inside a folder like 'public')
app.use(express.static(path.join(__dirname)));

// Serve the index.html file for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));  // Ensure it's pointing to the correct location of index.html
});

// Listen on the specified port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
