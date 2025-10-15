/**
 * Routes Index
 * 
 * Central routing configuration
 */

const express = require('express');
const router = express.Router();

const walletRoutes = require('./wallet.routes');
const nftRoutes = require('./nft.routes');

// Mount route modules
router.use('/wallet', walletRoutes);
router.use('/nft', nftRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hedera Game Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
router.get('/info', (req, res) => {
  const hederaService = require('../services/hedera.service');
  const tokenId = hederaService.getTokenId();
  
  res.status(200).json({
    success: true,
    api: {
      name: 'Hedera Game Backend API',
      version: '1.0.0',
      description: 'Backend API for game decentralization with Hedera Hashgraph',
      network: process.env.HEDERA_NETWORK || 'testnet',
      nftCollection: {
        tokenId: tokenId || 'Not initialized',
        name: process.env.NFT_TOKEN_NAME || 'GameExclusiveAsset',
        symbol: process.env.NFT_TOKEN_SYMBOL || 'GAME'
      }
    },
    endpoints: {
      wallet: {
        connect: 'POST /api/wallet/connect',
        status: 'GET /api/wallet/status/:accountId',
        verify: 'POST /api/wallet/verify'
      },
      nft: {
        mint: 'POST /api/nft/mint',
        info: 'GET /api/nft/:tokenId/:serialNumber',
        collection: 'GET /api/nft/collection/info',
        eligibility: 'GET /api/nft/eligibility/:accountId'
      }
    }
  });
});

module.exports = router;

