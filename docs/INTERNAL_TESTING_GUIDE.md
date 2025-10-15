# Internal API Testing Guide

**Version: 1.0.0**

## 1. Introduction

This document provides instructions for developers to test the **Hedera Game Backend API** locally. Following these steps will ensure that the API is running correctly, connecting to the Hedera testnet, and performing all required functions as expected.

## 2. Prerequisites

Before you begin testing, make sure you have the following tools and accounts set up:

1.  **Node.js and npm**: Ensure Node.js (v18 or higher) and npm are installed on your system.
2.  **cURL or Postman**: A tool for making HTTP requests. This guide will use `cURL` in its examples.
3.  **Hedera Testnet Account**: You need an account on the Hedera testnet. If you don't have one, you can create one for free at the [Hedera Developer Portal](https://portal.hedera.com/).
4.  **Testnet HBAR**: Your testnet account must have a balance of HBAR to cover transaction fees. The portal provides a faucet for free testnet HBAR.

## 3. Local Setup and Configuration

1.  **Clone the Repository**: If you haven't already, clone the project to your local machine.

2.  **Install Dependencies**:

    ```bash
    cd hedera-game-backend
    npm install
    ```

3.  **Configure Environment Variables**:

    Create a `.env` file in the root of the project by copying the example file:

    ```bash
    cp .env.example .env
    ```

    Now, open the `.env` file and fill in the required credentials:

    -   `TREASURY_ACCOUNT_ID`: The account ID of your Hedera testnet account (e.g., `0.0.12345`). This account will pay for NFT creation and minting.
    -   `TREASURY_PRIVATE_KEY`: The **private key** associated with your treasury account.
    -   `SUPPLY_PRIVATE_KEY`: The **private key** that will be used to sign minting transactions. For this MVP, you can use the same private key as the treasury account.

    **Example `.env` configuration**:

    ```
    # Server Configuration
    PORT=3000

    # Hedera Network Configuration
    HEDERA_NETWORK=testnet

    # Treasury Account Credentials
    TREASURY_ACCOUNT_ID=0.0.98765
    TREASURY_PRIVATE_KEY=302e020100300506032b657004220420...your_private_key...

    # Supply Key for NFT Minting
    SUPPLY_PRIVATE_KEY=302e020100300506032b657004220420...your_private_key...

    # ... (other settings can remain as default for testing)
    ```

4.  **Initialize the NFT Collection**:

    For the first run, you need to create the NFT collection on the Hedera network. Open `src/server.js` and uncomment the following line inside the `initializeApp` function:

    ```javascript
    // Uncomment the following line to create a new NFT collection on startup
    const tokenId = await hederaService.createNFTCollection();
    ```

5.  **Start the Server**:

    Run the following command to start the API server in development mode:

    ```bash
    npm run dev
    ```

    When the server starts for the first time, it will create the NFT collection and log the new `Token ID`. **Copy this Token ID** and add it to your `.env` file as `NFT_TOKEN_ID`.

    ```
    NFT_TOKEN_ID=0.0.56789
    ```

    Then, **re-comment the line** in `src/server.js` and restart the server. The server will now use the existing token ID instead of creating a new one on every start.

## 4. Testing API Endpoints

Use a new terminal window to run the following `cURL` commands. Replace `0.0.12345` with a valid Hedera testnet account ID that you will use to simulate a player.

### 4.1. Health and Info

**Test**: Check if the API is running.

```bash
curl http://localhost:3000/api/health
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Hedera Game Backend API is running",
  "timestamp": "..."
}
```

**Test**: Get API information and check if the NFT collection is initialized.

```bash
curl http://localhost:3000/api/info
```

**Expected Response**:

```json
{
  "success": true,
  "api": {
    "name": "Hedera Game Backend API",
    "version": "1.0.0",
    "network": "testnet",
    "nftCollection": {
      "tokenId": "0.0.56789" // Should show your Token ID
    }
  }
}
```

### 4.2. Wallet Connection

**Test**: Connect a valid player wallet.

```bash
curl -X POST http://localhost:3000/api/wallet/connect \
-H "Content-Type: application/json" \
-d '{"accountId": "0.0.12345"}'
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Wallet connected successfully",
  "data": {
    "accountId": "0.0.12345",
    "balance": ...
  }
}
```

**Test**: Attempt to connect an invalid wallet.

```bash
curl -X POST http://localhost:3000/api/wallet/connect \
-H "Content-Type: application/json" \
-d '{"accountId": "0.0.99999999"}'
```

**Expected Response (404 Not Found)**:

```json
{
  "success": false,
  "error": "Account not found on Hedera network"
}
```

### 4.3. NFT Minting

**Test**: Check if the player is eligible to mint.

```bash
curl http://localhost:3000/api/nft/eligibility/0.0.12345
```

**Expected Response**:

```json
{
  "success": true,
  "eligible": true,
  "data": {
    "accountId": "0.0.12345",
    "alreadyOwnsNFT": false
  }
}
```

**Test**: Mint an NFT for the player.

> **Note**: Before you can mint, the player's account (`0.0.12345`) must be **associated** with the NFT's Token ID (`0.0.56789`). The current MVP does not include an association endpoint, so this mint will fail unless you manually associate the token using a Hedera wallet like HashPack. This is a key finding for the TRD.

```bash
curl -X POST http://localhost:3000/api/nft/mint \
-H "Content-Type: application/json" \
-d '{
  "accountId": "0.0.12345", 
  "assetName": "Test Asset", 
  "attributes": {"rarity": "Common"}
}'
```

**Expected Response (if associated)**:

```json
{
  "success": true,
  "message": "NFT minted successfully",
  "data": {
    "tokenId": "0.0.56789",
    "serialNumber": "1",
    "transactionId": "...",
    "explorerUrl": "https://hashscan.io/testnet/token/0.0.56789/1"
  }
}
```

### 4.4. Verify NFT on HashScan

1.  Copy the `explorerUrl` from the minting response.
2.  Paste it into your browser.
3.  You should see the newly minted NFT on HashScan, owned by the player's account ID.

### 4.5. Get NFT and Collection Info

**Test**: Retrieve information about the minted NFT.

```bash
curl http://localhost:3000/api/nft/0.0.56789/1
```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "tokenId": "0.0.56789",
    "serialNumber": "1",
    "accountId": "0.0.12345",
    "metadata": {
      "name": "Test Asset",
      "attributes": {"rarity": "Common"}
    }
  }
}
```

**Test**: Retrieve information about the entire collection.

```bash
curl http://localhost:3000/api/nft/collection/info
```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "tokenId": "0.0.56789",
    "name": "GameExclusiveAsset",
    "symbol": "GAME",
    "totalSupply": "1",
    "maxSupply": "10000"
  }
}
```

## 5. Conclusion

If you can successfully complete all the steps above, the API is working correctly. Any failures in the minting process are likely due to a lack of token association, which is a known limitation of this MVP and should be addressed in the full implementation.

