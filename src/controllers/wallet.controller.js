/**
 * Wallet Controller
 * 
 * Handles wallet connection and verification endpoints
 */

const hederaService = require('../services/hedera.service');
const mirrorNodeService = require('../services/mirrorNode.service');

/**
 * Connect wallet endpoint
 * Verifies that the provided account ID exists on Hedera network
 * 
 * @route POST /api/wallet/connect
 * @body {string} accountId - Hedera account ID (format: 0.0.xxxxx)
 */
async function connectWallet(req, res) {
  try {
    const { accountId } = req.body;

    // Validate input
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      });
    }

    // Validate account ID format (basic validation)
    const accountIdPattern = /^0\.0\.\d+$/;
    if (!accountIdPattern.test(accountId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID format. Expected format: 0.0.xxxxx'
      });
    }

    // Verify account exists on Hedera network
    const accountExists = await hederaService.verifyAccount(accountId);

    if (!accountExists) {
      return res.status(404).json({
        success: false,
        error: 'Account not found on Hedera network'
      });
    }

    // Get account info from mirror node
    const accountInfo = await mirrorNodeService.getAccountInfo(accountId);

    res.status(200).json({
      success: true,
      message: 'Wallet connected successfully',
      data: {
        accountId,
        balance: accountInfo.balance?.balance || 0,
        alias: accountInfo.alias || null,
        evmAddress: accountInfo.evm_address || null
      }
    });
  } catch (error) {
    console.error('Error in connectWallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect wallet',
      details: error.message
    });
  }
}

/**
 * Get wallet status endpoint
 * Retrieves current wallet information and token balances
 * 
 * @route GET /api/wallet/status/:accountId
 * @param {string} accountId - Hedera account ID
 */
async function getWalletStatus(req, res) {
  try {
    const { accountId } = req.params;

    // Validate account ID format
    const accountIdPattern = /^0\.0\.\d+$/;
    if (!accountIdPattern.test(accountId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID format. Expected format: 0.0.xxxxx'
      });
    }

    // Get account info
    const accountInfo = await mirrorNodeService.getAccountInfo(accountId);

    // Get token balances
    const tokenBalances = await mirrorNodeService.getAccountTokenBalances(accountId);

    // Check if associated with game NFT token
    const gameTokenId = hederaService.getTokenId();
    const isAssociated = gameTokenId 
      ? await mirrorNodeService.isTokenAssociated(accountId, gameTokenId)
      : false;

    // Get owned game NFTs if associated
    let ownedNFTs = [];
    if (isAssociated && gameTokenId) {
      ownedNFTs = await mirrorNodeService.getAccountNFTs(accountId, gameTokenId);
    }

    res.status(200).json({
      success: true,
      data: {
        accountId,
        balance: accountInfo.balance?.balance || 0,
        tokenBalances: tokenBalances.length,
        gameToken: {
          tokenId: gameTokenId,
          associated: isAssociated,
          ownedNFTs: ownedNFTs.length,
          nfts: ownedNFTs.map(nft => ({
            serialNumber: nft.serial_number,
            metadata: nft.metadata
          }))
        }
      }
    });
  } catch (error) {
    console.error('Error in getWalletStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet status',
      details: error.message
    });
  }
}

/**
 * Verify wallet ownership endpoint
 * Additional verification that can be used for security
 * 
 * @route POST /api/wallet/verify
 * @body {string} accountId - Hedera account ID
 */
async function verifyWallet(req, res) {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      });
    }

    const accountExists = await hederaService.verifyAccount(accountId);

    res.status(200).json({
      success: true,
      verified: accountExists,
      accountId
    });
  } catch (error) {
    console.error('Error in verifyWallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify wallet',
      details: error.message
    });
  }
}

module.exports = {
  connectWallet,
  getWalletStatus,
  verifyWallet
};

