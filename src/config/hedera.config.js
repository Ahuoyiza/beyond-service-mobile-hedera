/**
 * Hedera Network Configuration
 * 
 * This module provides configuration settings for connecting to the Hedera network.
 * It supports both testnet and mainnet environments.
 */

require('dotenv').config();

const {
  Client,
  AccountId,
  PrivateKey
} = require('@hashgraph/sdk');

/**
 * Get Hedera client configured for the specified network
 * @returns {Client} Configured Hedera client
 */
function getHederaClient() {
  const network = process.env.HEDERA_NETWORK || 'testnet';
  
  let client;
  
  if (network === 'testnet') {
    client = Client.forTestnet();
  } else if (network === 'mainnet') {
    client = Client.forMainnet();
  } else {
    throw new Error(`Unsupported network: ${network}`);
  }
  
  // Set operator account (treasury account)
  const operatorId = AccountId.fromString(process.env.TREASURY_ACCOUNT_ID);
  const operatorKey = PrivateKey.fromString(process.env.TREASURY_PRIVATE_KEY);
  
  client.setOperator(operatorId, operatorKey);
  
  // Set default transaction fee and query payment
  client.setDefaultMaxTransactionFee(100); // 100 HBAR max fee
  client.setDefaultMaxQueryPayment(50); // 50 HBAR max query payment
  
  return client;
}

/**
 * Get supply key for NFT minting operations
 * @returns {PrivateKey} Supply private key
 */
function getSupplyKey() {
  return PrivateKey.fromString(process.env.SUPPLY_PRIVATE_KEY);
}

/**
 * Get treasury account ID
 * @returns {AccountId} Treasury account ID
 */
function getTreasuryAccountId() {
  return AccountId.fromString(process.env.TREASURY_ACCOUNT_ID);
}

/**
 * Get NFT configuration
 * @returns {Object} NFT configuration object
 */
function getNFTConfig() {
  return {
    tokenName: process.env.NFT_TOKEN_NAME || 'GameExclusiveAsset',
    tokenSymbol: process.env.NFT_TOKEN_SYMBOL || 'GAME',
    maxSupply: parseInt(process.env.NFT_MAX_SUPPLY) || 10000
  };
}

/**
 * Get mirror node URL
 * @returns {string} Mirror node URL
 */
function getMirrorNodeUrl() {
  return process.env.MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com';
}

module.exports = {
  getHederaClient,
  getSupplyKey,
  getTreasuryAccountId,
  getNFTConfig,
  getMirrorNodeUrl
};

