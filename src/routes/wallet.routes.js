/**
 * Wallet Routes
 * 
 * Defines API endpoints for wallet operations
 */

const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');

// POST /api/wallet/connect - Connect wallet
router.post('/connect', walletController.connectWallet);

// GET /api/wallet/status/:accountId - Get wallet status
router.get('/status/:accountId', walletController.getWalletStatus);

// POST /api/wallet/verify - Verify wallet
router.post('/verify', walletController.verifyWallet);

module.exports = router;

