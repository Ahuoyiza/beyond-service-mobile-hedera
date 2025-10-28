const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const serverConfig = require('./config/server.config');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./utils/errorHandler');

const app = express();

// Load environment variables for API Key check
require('dotenv').config();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors(serverConfig.cors));

// Rate limiting
const limiter = rateLimit({
  windowMs: serverConfig.rateLimit.windowMs,
  max: serverConfig.rateLimit.max,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (serverConfig.env === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// --- API Key Security Middleware ---
const API_KEY = process.env.GAME_API_KEY;

if (serverConfig.env !== 'development' && !API_KEY) {
    console.error("FATAL: GAME_API_KEY is not set. API will not start securely.");
    process.exit(1);
}

// Middleware to check API Key (only in non-development environments)
if (serverConfig.env !== 'development') {
  app.use("/api", (req, res, next) => {
      const providedKey = req.headers["x-api-key"]; // Expect key in header
      
      if (providedKey && providedKey === API_KEY) {
          next(); // Key is valid, proceed
      } else {
          res.status(401).json({ success: false, error: "Unauthorized: Invalid or missing X-API-Key header" });
      }
  });
} else {
  console.log("INFO: API Key check is disabled in development environment.");
}

// Mount API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hedera Game Backend API',
    version: '1.0.0',
    documentation: '/api/info'
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;

