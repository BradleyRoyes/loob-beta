// Import the CORS package if needed
// const cors = require('cors');

// Define CORS options
const corsOptions = {
  origin: "*", // You can set this to a specific origin or multiple origins
  methods: "POST", // Allow only POST requests, you can specify other methods as needed
  optionsSuccessStatus: 204, // No content response for preflight requests
};

// Middleware function to handle CORS
function handleCors(req, res, next) {
  // Enable CORS for the specified options
  res.header("Access-Control-Allow-Origin", corsOptions.origin);
  res.header("Access-Control-Allow-Methods", corsOptions.methods);
  res.header("Access-Control-Allow-Headers", "Content-Type");

  // Check if it's a preflight request (OPTIONS)
  if (req.method === "OPTIONS") {
    res.sendStatus(corsOptions.optionsSuccessStatus);
  } else {
    next();
  }
}

module.exports = { handleCors };
