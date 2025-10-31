# Beyond Service Game Hedera Backend API

**Version: 1.0.0**  
**Author:** Sophia Ahuoyiza Abubakar  
**Date:** 29th October 2025

This project provides a backend API implementation for integrating Hedera Hashgraph features into a game. It is designed to serve as a bridge between our Unreal Engine game client and the Hedera network, enabling features like wallet connection and the minting of exclusive in-game items as Non-Fungible Tokens (NFTs).

This initial version (MVP) focuses on providing a simple, testable framework for connecting to the Hedera testnet.

---

## 🌐 Live API Deployment

The API is **already deployed and running** on Railway. You can interact with it immediately without any local setup.

### Quick Start with Live API

**Base URL:**
```
https://beyond-service-mobile-hedera-production.up.railway.app
```

**Authentication:**  
All requests require the `X-API-Key` header:
```bash
X-API-Key: [redacted] request from the team
```

**Example Request:**
```bash
curl -X POST https://beyond-service-mobile-hedera-production.up.railway.app/api/nft/mint \
  -H "Content-Type: application/json" \
  -H "X-API-Key: xxxxxxxx" \
  -d '{
    "accountId": "0.0.YOUR_ACCOUNT_ID",
    "assetType": "legendary_sword",
    "assetName": "Oya'\''s Thunder Blade"
  }'
```

**Live Endpoints:**
- Health Check: `GET https://beyond-service-mobile-hedera-production.up.railway.app/api/health`
- API Info: `GET https://beyond-service-mobile-hedera-production.up.railway.app/api/info`
- Connect Wallet: `POST https://beyond-service-mobile-hedera-production.up.railway.app/api/wallet/connect`
- Mint NFT: `POST https://beyond-service-mobile-hedera-production.up.railway.app/api/nft/mint`

### Deployed Hedera Configuration

| Configuration | Value | Description |
| :--- | :--- | :--- |
| **Network** | Hedera Testnet | All transactions occur on testnet |
| **Treasury Account** | `0.0.7098468` | Account that pays transaction fees |
| **NFT Token ID** | `0.0.7109238` | The game's NFT collection ID |
| **Token Symbol** | `BS_GAME` | Collection symbol |
| **Token Name** | `BSHD_Artefacts` | Collection name |
| **Max Supply** | `10,000` | Maximum NFTs that can be minted |
| **Current Supply** | `1` | NFTs minted so far |

---

## Features

-   **RESTful API**: A clean and simple API built with Express.js.
-   **Wallet Connection**: Endpoints to verify player Hedera accounts.
-   **NFT Minting**: An endpoint to mint exclusive game assets as NFTs on the Hedera testnet.
-   **Security**: API Key authentication, rate limiting, CORS protection.
-   **Duplicate Prevention**: Each wallet can only mint ONE exclusive game asset.
-   **Token Association Check**: Automatically verifies token association before minting.
-   **Mirror Node Integration**: Real-time blockchain data queries.
-   **Configurable**: Easily configurable through environment variables.
-   **Documentation**: Includes comprehensive guides for Unreal Engine integration and local testing.
-   **Scalable Structure**: Organized into services, controllers, and routes for future expansion.

---

## 💻 Local Development Setup (Optional)

If you want to run the API locally for development or testing, follow these steps.

### Prerequisites

Before you can run this project locally, you will need the following:

-   **Node.js**: Version 18.x or higher.
-   **npm**: Version 9.x or higher.
-   **Hedera Testnet Account**: A free account from the [Hedera Developer Portal](https://portal.hedera.com/).
-   **Testnet HBAR**: Your account must be funded with test HBAR from the portal's faucet to cover transaction fees.

### Installation

Follow these steps to get the project up and running on your local machine.

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/Ahuoyiza/beyond-service-mobile-hedera.git
    cd hedera-game-backend
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

### Configuration

Configuration is managed through environment variables.

1.  **Create a `.env` file**:

    Copy the example configuration file to create your own local setup.

    ```bash
    cp .env.example .env
    ```

2.  **Edit the `.env` file**:

    Open the `.env` file and provide the necessary credentials for your Hedera testnet account.

    ```env
    # Server Configuration
    NODE_ENV=development
    PORT=3000

    # Hedera Network Configuration
    HEDERA_NETWORK=testnet

    # Treasury Account Credentials
    TREASURY_ACCOUNT_ID=0.0.XXXXXXX
    TREASURY_PRIVATE_KEY=302e020100300506032b657004220420...

    # Supply Key for NFT Minting
    SUPPLY_PRIVATE_KEY=302e020100300506032b657004220420...

    # NFT Collection Configuration
    NFT_TOKEN_ID=0.0.7109238

    # API Security (disabled in development mode)
    API_KEY=xxxxxxxxxx
    ```

    **Important Notes:**
    - `TREASURY_ACCOUNT_ID`: Your Hedera testnet account ID (e.g., `0.0.12345`).
    - `TREASURY_PRIVATE_KEY`: The private key for your treasury account.
    - `SUPPLY_PRIVATE_KEY`: The private key used to sign minting transactions. For this MVP, you can use the same key as the treasury.
    - `NFT_TOKEN_ID`: Use `0.0.7109238` to interact with the existing collection, or create your own.
    - `API_KEY`: Authentication is **disabled** in development mode for easier testing.

### Running the Application

#### Development Mode (with hot-reloading):

```bash
npm run dev
```

#### Production Mode:

```bash
npm start
```

The API will be available at `http://localhost:3000`.

**Note:** When running locally in development mode (`NODE_ENV=development`), API Key authentication is disabled. You can make requests without the `X-API-Key` header.

### First-Time Setup: Creating Your Own NFT Collection (Optional)

If you want to create your own NFT collection instead of using the existing one:

1.  **Enable Collection Creation**:
    Open `src/server.js` and uncomment this line:

    ```javascript
    // const tokenId = await hederaService.createNFTCollection();
    ```

2.  **Start the Server**:

    ```bash
    npm run dev
    ```

    The server will start, and the console will log the new `Token ID` for the NFT collection. **Copy this ID**.

3.  **Update `.env`**:
    Paste the new Token ID into your `.env` file:

    ```env
    NFT_TOKEN_ID=0.0.YYYYYY
    ```

4.  **Disable Collection Creation**:
    Re-comment the line in `src/server.js` to prevent creating a new collection on every server start. Then, restart the server.

---

## API Endpoints

Here is a summary of the available API endpoints.

| Endpoint | Method | Description | Authentication |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Checks if the API is running. | None |
| `/api/info` | `GET` | Provides information about the API and NFT collection. | None |
| `/api/wallet/connect` | `POST` | Connects and verifies a player's Hedera wallet. | Required (production) |
| `/api/nft/eligibility/:id` | `GET` | Checks if a player is eligible to mint an NFT. | Required (production) |
| `/api/nft/mint` | `POST` | Mints a new exclusive NFT for the player. | Required (production) |
| `/api/nft/collection/info` | `GET` | Retrieves details about the game's NFT collection. | None |
| `/api/nft/:tokenId/:serial` | `GET` | Retrieves details for a specific NFT. | None |

### Detailed Endpoint Documentation

#### 1. Health Check
```bash
GET /api/health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-29T14:00:00.000Z"
}
```

#### 2. API Info
```bash
GET /api/info
```
**Response:**
```json
{
  "name": "Hedera Game Backend API",
  "version": "1.0.0",
  "network": "testnet",
  "nftCollection": {
    "tokenId": "0.0.7109238",
    "symbol": "BS_GAME",
    "name": "BSHD_Artefacts"
  }
}
```

#### 3. Connect Wallet
```bash
POST /api/wallet/connect
Headers: X-API-Key: xxxxxxxx
Content-Type: application/json

{
  "accountId": "0.0.7157444"
}
```
**Success Response:**
```json
{
  "success": true,
  "message": "Wallet connected successfully",
  "data": {
    "accountId": "0.0.7157444",
    "balance": "999.74695248",
    "isAssociated": true
  }
}
```

#### 4. Mint NFT
```bash
POST /api/nft/mint
Headers: X-API-Key: S0mad1na%BS[
Content-Type: application/json

{
  "accountId": "0.0.7157444",
  "assetType": "legendary_sword",
  "assetName": "Oya's Thunder Blade"
}
```
**Success Response:**
```json
{
  "success": true,
  "message": "NFT minted successfully",
  "data": {
    "tokenId": "0.0.7109238",
    "serialNumber": 1,
    "transactionId": "0.0.7098468@1761761341.226332123",
    "explorerUrl": "https://hashscan.io/testnet/transaction/0.0.7098468@1761761341.226332123",
    "metadata": {
      "name": "Oya's Thunder Blade",
      "type": "game_asset",
      "attributes": {
        "rarity": "epic"
      }
    }
  }
}
```

**Error Response (Already Minted):**
```json
{
  "success": false,
  "error": "Account already owns an exclusive game asset",
  "data": {
    "ownedNFTs": [
      {
        "serialNumber": 1,
        "tokenId": "0.0.7109238"
      }
    ],
    "message": "Each wallet can only mint one exclusive game asset"
  }
}
```

**Error Response (Not Associated):**
```json
{
  "success": false,
  "error": "Token association required",
  "data": {
    "tokenId": "0.0.7109238",
    "instructions": "Please associate the token in your Hedera wallet before minting"
  }
}
```

---

## Project Structure

```
/hedera-game-backend
|-- /docs                 # Documentation files
|   |-- UNREAL_ENGINE_INTEGRATION.md
|   |-- INTERNAL_TESTING_GUIDE.md
|-- /src
|   |-- /config           # Configuration for Hedera and Express
|   |   |-- hedera.config.js
|   |-- /controllers      # API route handlers (business logic)
|   |   |-- nft.controller.js
|   |   |-- wallet.controller.js
|   |-- /routes           # API route definitions
|   |   |-- nft.routes.js
|   |   |-- wallet.routes.js
|   |-- /services         # Services for Hedera and Mirror Node interaction
|   |   |-- hedera.service.js
|   |   |-- mirrorNode.service.js
|   |-- /utils            # Utility functions (error handler, logger)
|   |   |-- errorHandler.js
|   |   |-- logger.js
|   |-- app.js            # Express application setup
|   |-- server.js         # Server entry point
|-- /tests                # Test files
|-- .env.example          # Example environment file
|-- .gitignore
|-- package.json
|-- README.md
|-- API_README.md
```

---

## Security Features

### API Key Authentication
- **Production Mode**: All endpoints (except health and info) require the `X-API-Key` header.
- **Development Mode**: API Key authentication is disabled for easier local testing.

### Rate Limiting
- **Minting Cooldown**: 5-minute cooldown between mint attempts per account.
- **Request Rate Limiting**: Prevents abuse and ensures fair usage.

### CORS Protection
- Configured to allow requests from authorized origins.
- Can be customized in `src/app.js`.

### Duplicate Prevention
- Each Hedera account can only mint **ONE** exclusive game asset.
- Enforced through Mirror Node queries before minting.

---

## Testing

### Testing the Live API

Use the provided `curl` commands or tools like Postman to test the live API:

```bash
# Test health endpoint
curl https://beyond-service-mobile-hedera-production.up.railway.app/api/health

# Test minting (replace with your account ID)
curl -X POST https://beyond-service-mobile-hedera-production.up.railway.app/api/nft/mint \
  -H "Content-Type: application/json" \
  -H "X-API-Key: xxxxxx" \
  -d '{
    "accountId": "0.0.YOUR_ACCOUNT_ID",
    "assetType": "legendary_sword",
    "assetName": "Test Sword"
  }'
```

### Testing Locally

When running locally in development mode, you can omit the `X-API-Key` header:

```bash
# Test local health endpoint
curl http://localhost:3000/api/health

# Test local minting (no API key required in dev mode)
curl -X POST http://localhost:3000/api/nft/mint \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "0.0.YOUR_ACCOUNT_ID",
    "assetType": "legendary_sword",
    "assetName": "Test Sword"
  }'
```

---

## Documentation

This project includes the following detailed documentation in the `/docs` directory:

-   **`UNREAL_ENGINE_INTEGRATION.md`**: A guide for Unreal Engine developers on how to communicate with this API.
-   **`INTERNAL_TESTING_GUIDE.md`**: Instructions for developers on how to test the API locally.


---

## Troubleshooting

### Common Issues

**Issue: "Token association required" error**
- **Solution**: The player must associate the token (`0.0.7109238`) in their Hedera wallet before minting.
- **How to Associate**:
  1. Open HashPack or Blade wallet
  2. Navigate to "Tokens" section
  3. Click "Associate Token"
  4. Enter Token ID: `0.0.7109238`
  5. Confirm transaction

**Issue: "Account already owns an exclusive game asset" error**
- **Solution**: This is expected behavior. Each wallet can only mint ONE NFT. This is a feature, not a bug.

**Issue: API returns 401 Unauthorized**
- **Solution**: Ensure you're including the `X-API-Key` header in production requests.
- **Header**: `X-API-Key: xxxxxxx`

**Issue: Local server won't start**
- **Solution**: Check that all environment variables are set correctly in `.env`.
- **Required Variables**: `TREASURY_ACCOUNT_ID`, `TREASURY_PRIVATE_KEY`, `SUPPLY_PRIVATE_KEY`, `NFT_TOKEN_ID`

---

## Deployment

The API is deployed on [Railway](https://railway.app) with automatic GitHub integration.

### Environment Variables on Railway

The following environment variables are configured on Railway:

```env
NODE_ENV=production
PORT=3000
HEDERA_NETWORK=testnet
TREASURY_ACCOUNT_ID=0.0.7098468
TREASURY_PRIVATE_KEY=<redacted>
SUPPLY_PRIVATE_KEY=<redacted>
NFT_TOKEN_ID=0.0.7109238
API_KEY=xxxxxxx
```

### Deployment Process

1. Push code to GitHub repository
2. Railway automatically detects changes
3. Railway builds and deploys the application
4. API is available at the Railway-provided URL

---

## Future Enhancements

- **WalletConnect Integration**: Automate token association through WalletConnect.
- **In-Game Inventory**: Display minted NFTs in the game's inventory system.
- **Marketplace Integration**: Enable trading of game assets on external marketplaces.
- **Multi-Asset Support**: Support multiple NFT collections for different game items.
- **Metadata IPFS Storage**: Store rich metadata (images, animations) on IPFS.
- **Mainnet Deployment**: Transition from testnet to mainnet for production.

---


## License

This project is submitted for the Hedera Africa Hackathon 2025.



