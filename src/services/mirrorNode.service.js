/**
 * Mirror Node Service
 * 
 * This service handles queries to the Hedera Mirror Node REST API for:
 * - Account information
 * - Token balances
 * - NFT ownership verification
 * - Transaction history
 */

const { getMirrorNodeUrl } = require('../config/hedera.config');

class MirrorNodeService {
  constructor() {
    this.baseUrl = getMirrorNodeUrl();
  }

  /**
   * Get account information from mirror node
   * @param {string} accountId - Account ID to query
   * @returns {Promise<Object>} Account information
   */
  async getAccountInfo(accountId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/accounts/${accountId}`);
      
      if (!response.ok) {
        throw new Error(`Mirror node request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching account info for ${accountId}:`, error);
      throw new Error(`Failed to fetch account info: ${error.message}`);
    }
  }

  /**
   * Get token balances for an account
   * @param {string} accountId - Account ID to query
   * @returns {Promise<Array>} Array of token balances
   */
  async getAccountTokenBalances(accountId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/accounts/${accountId}/tokens?limit=100`);
      
      if (!response.ok) {
        throw new Error(`Mirror node request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      const tokenBalances = [...data.tokens];

      // Handle pagination if there are more results
      let nextLink = data.links?.next;
      while (nextLink) {
        const nextResponse = await fetch(`${this.baseUrl}${nextLink}`);
        const nextData = await nextResponse.json();
        tokenBalances.push(...nextData.tokens);
        nextLink = nextData.links?.next;
      }

      return tokenBalances;
    } catch (error) {
      console.error(`Error fetching token balances for ${accountId}:`, error);
      throw new Error(`Failed to fetch token balances: ${error.message}`);
    }
  }

  /**
   * Check if account has associated with a specific token
   * @param {string} accountId - Account ID to check
   * @param {string} tokenId - Token ID to check association
   * @returns {Promise<boolean>} True if associated
   */
  async isTokenAssociated(accountId, tokenId) {
    try {
      const tokenBalances = await this.getAccountTokenBalances(accountId);
      return tokenBalances.some(token => token.token_id === tokenId);
    } catch (error) {
      console.error(`Error checking token association:`, error);
      return false;
    }
  }

  /**
   * Get NFTs owned by an account for a specific token
   * @param {string} accountId - Account ID to query
   * @param {string} tokenId - Token ID to filter
   * @returns {Promise<Array>} Array of NFT serial numbers owned
   */
  async getAccountNFTs(accountId, tokenId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/accounts/${accountId}/nfts?token.id=${tokenId}`
      );
      
      if (!response.ok) {
        throw new Error(`Mirror node request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.nfts || [];
    } catch (error) {
      console.error(`Error fetching NFTs for ${accountId}:`, error);
      throw new Error(`Failed to fetch NFTs: ${error.message}`);
    }
  }

  /**
   * Get token information
   * @param {string} tokenId - Token ID to query
   * @returns {Promise<Object>} Token information
   */
  async getTokenInfo(tokenId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/tokens/${tokenId}`);
      
      if (!response.ok) {
        throw new Error(`Mirror node request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching token info for ${tokenId}:`, error);
      throw new Error(`Failed to fetch token info: ${error.message}`);
    }
  }

  /**
   * Get NFT metadata by token ID and serial number
   * @param {string} tokenId - Token ID
   * @param {string} serialNumber - NFT serial number
   * @returns {Promise<Object>} NFT information including metadata
   */
  async getNFTInfo(tokenId, serialNumber) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/tokens/${tokenId}/nfts/${serialNumber}`
      );
      
      if (!response.ok) {
        throw new Error(`Mirror node request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching NFT info:`, error);
      throw new Error(`Failed to fetch NFT info: ${error.message}`);
    }
  }

  /**
   * Get transaction information
   * @param {string} transactionId - Transaction ID to query
   * @returns {Promise<Object>} Transaction information
   */
  async getTransaction(transactionId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/transactions/${transactionId}`);
      
      if (!response.ok) {
        throw new Error(`Mirror node request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching transaction ${transactionId}:`, error);
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }
}

// Create singleton instance
const mirrorNodeService = new MirrorNodeService();

module.exports = mirrorNodeService;

