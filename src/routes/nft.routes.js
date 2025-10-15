/**
 * NFT Routes
 * 
 * Defines API endpoints for NFT operations
 */

const express = require('express');
const router = express.Router();
const nftController = require('../controllers/nft.controller');

// POST /api/nft/mint - Mint new NFT
router.post('/mint', nftController.mintNFT);

// GET /api/nft/:tokenId/:serialNumber - Get NFT info
router.get('/:tokenId/:serialNumber', nftController.getNFTInfo);

// GET /api/nft/collection/info - Get collection info
router.get('/collection/info', nftController.getCollectionInfo);

// GET /api/nft/eligibility/:accountId - Check minting eligibility
router.get('/eligibility/:accountId', nftController.checkEligibility);

module.exports = router;

