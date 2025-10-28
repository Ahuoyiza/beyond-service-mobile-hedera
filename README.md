# Hedera Game Backend API

**Version: 1.0.0**

This project provides a backend API implementation for integrating Hedera Hashgraph features into a game. It is designed to serve as a bridge between an Unreal Engine game client and the Hedera network, enabling features like wallet connection and the minting of exclusive in-game items as Non-Fungible Tokens (NFTs).

This initial version (MVP) focuses on providing a simple, testable framework for connecting to the Hedera testnet.

---

## Features

-   **RESTful API**: A clean and simple API built with Express.js.
-   **Wallet Connection**: Endpoints to verify player Hedera accounts.
-   **NFT Minting**: An endpoint to mint exclusive game assets as NFTs on the Hedera testnet.
-   **Configurable**: Easily configurable through environment variables.
-   **Documentation**: Includes comprehensive guides for Unreal Engine integration and local testing.
-   **Scalable Structure**: Organized into services, controllers, and routes for future expansion.

## Prerequisites

Before you can run this project, you will need the following:

-   **Node.js**: Version 18.x or higher.
-   **npm**: Version 9.x or higher.
-   **Hedera Testnet Account**: A free account from the [Hedera Developer Portal](https://portal.hedera.com/).
-   **Testnet HBAR**: Your account must be funded with test HBAR from the portal's faucet to cover transaction fees.

## Installation

Follow these steps to get the project up and running on your local machine.

1.  **Clone the repository**:

    ```bash
    git clone <https://github.com/Ahuoyiza/beyond-service-mobile-hedera.git>
    cd hedera-game-backend
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

## Configuration

Configuration is managed through environment variables.

1.  **Create a `.env` file**:

    Copy the example configuration file to create your own local setup.

    ```bash
    cp .env.example .env
    ```

2.  **Edit the `.env` file**:

    Open the `.env` file and provide the necessary credentials for your Hedera testnet account.

    -   `TREASURY_ACCOUNT_ID`: Your Hedera testnet account ID (e.g., `0.0.12345`).
    -   `TREASURY_PRIVATE_KEY`: The private key for your treasury account.
    -   `SUPPLY_PRIVATE_KEY`: The private key used to sign minting transactions. For this MVP, you can use the same key as the treasury.

    ```env
    # Server Configuration
    PORT=3000

    # Hedera Network Configuration
    HEDERA_NETWORK=testnet

    # Treasury Account Credentials
    TREASURY_ACCOUNT_ID=0.0.XXXXXXX
    TREASURY_PRIVATE_KEY=302e020100300506032b657004220420...

    # Supply Key for NFT Minting
    SUPPLY_PRIVATE_KEY=302e020100300506032b657004220420...

    # NFT Collection Configuration (optional - will be created on first run)
    NFT_TOKEN_ID=
    ```

## Running the Application

### 1. First-Time Setup: Creating the NFT Collection

The first time you start the server, you need to create the NFT collection on the Hedera network.

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

### 2. Normal Operation

To run the server in development mode with hot-reloading:

```bash
npm run dev
```

To run the server in production mode:

```bash
npm start
```

The API will be available at `http://localhost:3000`.

## API Endpoints

Here is a summary of the available API endpoints. For detailed information, refer to the **Internal Testing Guide**.

| Endpoint                      | Method | Description                                      |
| ----------------------------- | ------ | ------------------------------------------------ |
| `/api/health`                 | `GET`  | Checks if the API is running.                    |
| `/api/info`                   | `GET`  | Provides information about the API and NFT collection. |
| `/api/wallet/connect`         | `POST` | Connects and verifies a player's Hedera wallet.  |
| `/api/nft/eligibility/:id`    | `GET`  | Checks if a player is eligible to mint an NFT.   |
| `/api/nft/mint`               | `POST` | Mints a new exclusive NFT for the player.        |
| `/api/nft/collection/info`    | `GET`  | Retrieves details about the game's NFT collection.|
| `/api/nft/:tokenId/:serial`   | `GET`  | Retrieves details for a specific NFT.            |

## Project Structure

```
/hedera-game-backend
|-- /docs                 # Documentation files
|-- /src
|   |-- /config           # Configuration for Hedera and Express
|   |-- /controllers      # API route handlers (business logic)
|   |-- /routes           # API route definitions
|   |-- /services         # Services for Hedera and Mirror Node interaction
|   |-- /utils            # Utility functions (error handler, logger)
|   |-- app.js            # Express application setup
|   |-- server.js         # Server entry point
|-- /tests                # Test files
|-- .env.example          # Example environment file
|-- .gitignore
|-- package.json
|-- README.md
```

## Documentation

This project includes the following detailed documentation in the `/docs` directory:

-   **`UNREAL_ENGINE_INTEGRATION.md`**: A guide for Unreal Engine developers on how to communicate with this API.
-   **`INTERNAL_TESTING_GUIDE.md`**: Instructions for developers on how to test the API locally.




