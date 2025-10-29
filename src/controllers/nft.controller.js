/**
 * NFT Controller
 * 
 * Handles NFT minting and management endpoints
 */

const hederaService = require('../services/hedera.service');
const mirrorNodeService = require('../services/mirrorNode.service');

// In-memory rate limiting tracker for account-based minting
const accountMintTracker = new Map();

/**
 * Mint NFT endpoint
 * Mints a new exclusive game asset NFT for a connected wallet
 * 
 * @route POST /api/nft/mint
 * @body {string} accountId - Hedera account ID of the recipient
 * @body {string} assetName - Name of the game asset
 * @body {object} attributes - Additional attributes for the NFT
 */
async function mintNFT(req, res) {
  try {
    const { accountId, assetName, attributes } = req.body;

    // Validate input
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      });
    }

    if (!assetName) {
      return res.status(400).json({
        success: false,
        error: 'Asset name is required'
      });
    }

    // Validate account ID format
    const accountIdPattern = /^0\.0\.\d+$/;
    if (!accountIdPattern.test(accountId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID format. Expected format: 0.0.xxxxx'
      });
    }

    // CRITICAL FIX 1: Account-based rate limiting (prevent spam)
    const lastMintTime = accountMintTracker.get(accountId);
    const cooldownPeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (lastMintTime) {
      const timeSinceLastMint = Date.now() - lastMintTime;
      if (timeSinceLastMint < cooldownPeriod) {
        const waitTime = Math.ceil((cooldownPeriod - timeSinceLastMint) / 1000);
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          details: `Please wait ${waitTime} seconds before minting another NFT`,
          retryAfter: waitTime
        });
      }
    }

    // Verify account exists
    const accountExists = await hederaService.verifyAccount(accountId);
    if (!accountExists) {
      return res.status(404).json({
        success: false,
        error: 'Account not found on Hedera network'
      });
    }

    // CRITICAL FIX 2: Check if account already owns an NFT from this collection
    const tokenId = hederaService.getTokenId();
    if (!tokenId) {
      return res.status(500).json({
        success: false,
        error: 'NFT collection not initialized'
      });
    }

    const ownedNFTs = await mirrorNodeService.getAccountNFTs(accountId, tokenId);
    if (ownedNFTs.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Account already owns an exclusive game asset',
        data: {
          ownedNFTs: ownedNFTs.map(nft => ({
            serialNumber: nft.serial_number,
            tokenId: nft.token_id
          })),
          message: 'Each wallet can only mint one exclusive game asset'
        }
      });
    }

    // CRITICAL FIX 3: Verify token association before minting
    const isAssociated = await mirrorNodeService.isTokenAssociated(accountId, tokenId);
    if (!isAssociated) {
      return res.status(400).json({
        success: false,
        error: 'Token association required before minting',
        data: {
          tokenId,
          tokenSymbol: 'BS_GAME',
          tokenName: 'BSHD_Artefacts',
          associationRequired: true,
          instructions: {
            title: 'How to associate the token:',
            step1: '1. Open your Hedera wallet (HashPack or Blade)',
            step2: '2. Switch to Testnet network',
            step3: '3. Navigate to the "Tokens" section',
            step4: '4. Click "Associate Token" or "Add Token"',
            step5: `5. Enter Token ID: ${tokenId}`,
            step6: '6. Confirm the transaction (costs ~$0.05 in test HBAR)',
            step7: '7. Return to the game and try minting again'
          },
          helpLinks: {
            viewToken: `https://hashscan.io/testnet/token/${tokenId}`,
            hashPackGuide: 'https://docs.hashpack.app/'
          },
          note: 'This is a one-time setup per wallet. Future versions will automate this process via WalletConnect.'
        }
      } );
    }

    // Create NFT metadata (simplified to fit 100-byte limit)
    const metadata = {
      name: assetName,
      type: 'game_asset',
      attributes: attributes || {}
    };

    const metadataString = JSON.stringify(metadata);

    // Validate metadata size (Hedera limit is 100 bytes per metadata entry)
    if (Buffer.from(metadataString).length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Metadata exceeds maximum size of 100 bytes',
        details: 'Please reduce the asset name or attributes'
      });
    }

    // Mint and transfer the NFT to the recipient
    const mintResult = await hederaService.mintNFT(metadataString, accountId);

    // Update rate limiting tracker
    accountMintTracker.set(accountId, Date.now());

    res.status(201).json({
      success: true,
      message: 'NFT minted and transferred successfully',
      data: {
        tokenId: mintResult.tokenId,
        serialNumber: mintResult.serialNumber,
        recipient: mintResult.recipientAccountId,
        mintTransactionId: mintResult.mintTransactionId,
        transferTransactionId: mintResult.transferTransactionId,
        metadata: JSON.parse(mintResult.metadata),
        explorerUrl: `https://hashscan.io/testnet/transaction/${mintResult.transferTransactionId}`
      }
    } );
  } catch (error) {
    console.error('Error in mintNFT:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mint NFT',
      details: error.message
    });
  }
}

/**
 * Get NFT info endpoint
 * Retrieves information about a specific NFT
 * 
 * @route GET /api/nft/:tokenId/:serialNumber
 * @param {string} tokenId - Token ID
 * @param {string} serialNumber - Serial number of the NFT
 */
async function getNFTInfo(req, res) {
  try {
    const { tokenId, serialNumber } = req.params;

    const nftInfo = await mirrorNodeService.getNFTInfo(tokenId, serialNumber);

    // Parse metadata if it's JSON
    let parsedMetadata = nftInfo.metadata;
    try {
      const metadataString = Buffer.from(nftInfo.metadata, 'base64').toString('utf-8');
      parsedMetadata = JSON.parse(metadataString);
    } catch (e) {
      // If parsing fails, keep original metadata
    }

    res.status(200).json({
      success: true,
      data: {
        tokenId: nftInfo.token_id,
        serialNumber: nftInfo.serial_number,
        accountId: nftInfo.account_id,
        metadata: parsedMetadata,
        createdTimestamp: nftInfo.created_timestamp,
        modifiedTimestamp: nftInfo.modified_timestamp,
        explorerUrl: `https://hashscan.io/testnet/token/${tokenId}/${serialNumber}`
      }
    } );
  } catch (error) {
    console.error('Error in getNFTInfo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get NFT info',
      details: error.message
    });
  }
}

/**
 * Get collection info endpoint
 * Retrieves information about the NFT collection
 * 
 * @route GET /api/nft/collection/info
 */
async function getCollectionInfo(req, res) {
  try {
    const tokenId = hederaService.getTokenId();

    if (!tokenId) {
      return res.status(404).json({
        success: false,
        error: 'NFT collection not initialized'
      });
    }

    const tokenInfo = await mirrorNodeService.getTokenInfo(tokenId);

    res.status(200).json({
      success: true,
      data: {
        tokenId: tokenInfo.token_id,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        type: tokenInfo.type,
        totalSupply: tokenInfo.total_supply,
        maxSupply: tokenInfo.max_supply,
        treasuryAccountId: tokenInfo.treasury_account_id,
        createdTimestamp: tokenInfo.created_timestamp,
        explorerUrl: `https://hashscan.io/testnet/token/${tokenId}`
      }
    } );
  } catch (error) {
    console.error('Error in getCollectionInfo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get collection info',
      details: error.message
    });
  }
}

/**
 * Check eligibility endpoint
 * Checks if an account is eligible to mint an NFT
 * 
 * @route GET /api/nft/eligibility/:accountId
 * @param {string} accountId - Hedera account ID
 */
async function checkEligibility(req, res) {
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

    // Verify account exists
    const accountExists = await hederaService.verifyAccount(accountId);
    if (!accountExists) {
      return res.status(404).json({
        success: false,
        eligible: false,
        reason: 'Account not found on Hedera network'
      });
    }

    // Check if account already owns game NFTs
    const tokenId = hederaService.getTokenId();
    let ownedNFTs = [];
    let isAssociated = false;
    
    if (tokenId) {
      isAssociated = await mirrorNodeService.isTokenAssociated(accountId, tokenId);
      if (isAssociated) {
        ownedNFTs = await mirrorNodeService.getAccountNFTs(accountId, tokenId);
      }
    }

    // Eligibility logic: account exists, is associated, and doesn't already own an NFT
    const alreadyOwnsNFT = ownedNFTs.length > 0;
    const eligible = accountExists && !alreadyOwnsNFT;

    let reason = '';
    if (!accountExists) {
      reason = 'Account not found on Hedera network';
    } else if (!isAssociated) {
      reason = 'Account must be associated with the game token first';
    } else if (alreadyOwnsNFT) {
      reason = 'Account already owns an exclusive game asset';
    } else {
      reason = 'Account is eligible to mint exclusive game asset';
    }

    res.status(200).json({
      success: true,
      eligible,
      data: {
        accountId,
        isAssociated,
        alreadyOwnsNFT,
        ownedNFTCount: ownedNFTs.length,
        tokenId,
        reason
      }
    });
  } catch (error) {
    console.error('Error in checkEligibility:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check eligibility',
      details: error.message
    });
  }
}

module.exports = {
  mintNFT,
  getNFTInfo,
  getCollectionInfo,
  checkEligibility
};
