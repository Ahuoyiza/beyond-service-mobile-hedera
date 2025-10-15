/**
 * Server Entry Point
 * 
 * Starts the Express server and initializes Hedera services
 */

require('dotenv').config();
const app = require('./app');
const serverConfig = require('./config/server.config');
const hederaService = require('./services/hedera.service');
const logger = require('./utils/logger');

const PORT = serverConfig.port;

/**
 * Initialize application
 */
async function initializeApp() {
  try {
    logger.info('Initializing Hedera Game Backend...');

    // Check if NFT collection token ID is provided in environment
    const existingTokenId = process.env.NFT_TOKEN_ID;

    if (existingTokenId) {
      // Use existing token ID
      hederaService.setTokenId(existingTokenId);
      logger.info(`Using existing NFT collection: ${existingTokenId}`);
    } else {
      // Create new NFT collection
      logger.warn('No existing token ID found. To create a new NFT collection, uncomment the line below.');
      logger.warn('Note: Creating a new collection costs HBAR. Make sure your treasury account has sufficient balance.');
      
      // Uncomment the following line to create a new NFT collection on startup
      // const tokenId = await hederaService.createNFTCollection();
      // logger.info(`New NFT collection created: ${tokenId}`);
      // logger.info(`Add this to your .env file: NFT_TOKEN_ID=${tokenId}`);
    }

    logger.info('Hedera services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Hedera services:', error);
    logger.warn('Server will start but NFT operations may fail until properly configured');
  }
}

/**
 * Start server
 */
async function startServer() {
  await initializeApp();

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${serverConfig.env}`);
    logger.info(`Network: ${process.env.HEDERA_NETWORK || 'testnet'}`);
    logger.info(`API documentation available at: http://localhost:${PORT}/api/info`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      hederaService.close();
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      hederaService.close();
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

