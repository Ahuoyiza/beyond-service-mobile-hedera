/**
 * Server Configuration
 * 
 * This module provides configuration settings for the Express server.
 */

require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  
  // CORS configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000', 'http://localhost:8080'],
    credentials: true
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
  }
};

module.exports = config;

