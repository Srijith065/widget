const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the "wwwroot" directory (Azure's default directory)
app.use(express.static(path.join(__dirname, 'wwwroot')));

// Serve the index.html file for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'wwwroot', 'index.html'));
});

// Listen on the specified port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
