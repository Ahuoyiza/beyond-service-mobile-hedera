/**
 * Hedera Service
 * 
 * This service handles all interactions with the Hedera network including:
 * - NFT collection creation
 * - NFT minting
 * - Account verification
 * - Token association checks
 */

const {
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  AccountId,
  Status
} = require('@hashgraph/sdk');

const {
  getHederaClient,
  getSupplyKey,
  getTreasuryAccountId,
  getNFTConfig
} = require('../config/hedera.config');

class HederaService {
  constructor() {
    this.client = getHederaClient();
    this.supplyKey = getSupplyKey();
    this.treasuryId = getTreasuryAccountId();
    this.nftConfig = getNFTConfig();
    this.tokenId = null; // Will be set after creating NFT collection
  }

  /**
   * Create NFT collection (token)
   * This should be called once during initialization
   * @returns {Promise<string>} Token ID of created NFT collection
   */
  async createNFTCollection() {
    try {
      console.log('Creating NFT collection...');
      
      const nftCreateTx = await new TokenCreateTransaction()
        .setTokenName(this.nftConfig.tokenName)
        .setTokenSymbol(this.nftConfig.tokenSymbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(this.treasuryId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(this.nftConfig.maxSupply)
        .setSupplyKey(this.supplyKey.publicKey)
        .freezeWith(this.client);

      const nftCreateTxSigned = await nftCreateTx.sign(this.supplyKey);
      const nftCreateSubmit = await nftCreateTxSigned.execute(this.client);
      const nftCreateRx = await nftCreateSubmit.getReceipt(this.client);

      this.tokenId = nftCreateRx.tokenId.toString();
      
      console.log(`NFT collection created with Token ID: ${this.tokenId}`);
      
      return this.tokenId;
    } catch (error) {
      console.error('Error creating NFT collection:', error);
      throw new Error(`Failed to create NFT collection: ${error.message}`);
    }
  }

  /**
   * Set existing token ID (if collection already exists)
   * @param {string} tokenId - Existing token ID
   */
  setTokenId(tokenId) {
    this.tokenId = tokenId;
    console.log(`Token ID set to: ${this.tokenId}`);
  }

  /**
   * Mint a new NFT for a user
   * @param {string} metadata - NFT metadata (can be IPFS CID or JSON string)
   * @returns {Promise<Object>} Minting result with serial number and transaction ID
   */
  async mintNFT(metadata) {
    if (!this.tokenId) {
      throw new Error('Token ID not set. Create NFT collection first or set existing token ID.');
    }

    try {
      console.log(`Minting NFT with metadata: ${metadata.substring(0, 50)}...`);
      
      // Convert metadata to bytes
      const metadataBytes = Buffer.from(metadata);
      
      const mintTx = await new TokenMintTransaction()
        .setTokenId(this.tokenId)
        .addMetadata(metadataBytes)
        .freezeWith(this.client);

      const mintTxSigned = await mintTx.sign(this.supplyKey);
      const mintTxSubmit = await mintTxSigned.execute(this.client);
      const mintRx = await mintTxSubmit.getReceipt(this.client);

      const serialNumber = mintRx.serials[0].toString();
      const transactionId = mintTxSubmit.transactionId.toString();

      console.log(`NFT minted successfully. Serial: ${serialNumber}, TxID: ${transactionId}`);

      return {
        success: true,
        tokenId: this.tokenId,
        serialNumber,
        transactionId,
        metadata
      };
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw new Error(`Failed to mint NFT: ${error.message}`);
    }
  }

  /**
   * Verify if an account exists on Hedera network
   * @param {string} accountId - Account ID to verify
   * @returns {Promise<boolean>} True if account exists
   */
  async verifyAccount(accountId) {
    try {
      // Use Mirror Node API for verification (more reliable than SDK query)
      const mirrorNodeService = require('./mirrorNode.service');
      const accountInfo = await mirrorNodeService.getAccountInfo(accountId);
      
      console.log(`Account ${accountId} verified via Mirror Node. Balance: ${accountInfo.balance?.balance || 0}`);
      
      return true;
    } catch (error) {
      console.error(`Account verification failed for ${accountId}:`, error.message);
      return false;
    }
  }

  /**
   * Get current token ID
   * @returns {string|null} Current token ID
   */
  getTokenId() {
    return this.tokenId;
  }

  /**
   * Close Hedera client connection
   */
  close() {
    if (this.client) {
      this.client.close();
      console.log('Hedera client connection closed');
    }
  }
}

// Create singleton instance
const hederaService = new HederaService();

module.exports = hederaService;
