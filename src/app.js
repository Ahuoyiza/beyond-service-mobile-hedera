/**
 * Express Application Configuration
 * 
 * Configures and exports the Express application
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const serverConfig = require('./config/server.config');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./utils/errorHandler');

const app = express();

// Trust proxy - required for Railway and other cloud platforms
// This allows Express to correctly identify client IPs behind proxies
app.set('trust proxy', 1);

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
