# Unreal Engine Integration Guide for Hedera Game Backend

**Version: 1.0.0**

## 1. Introduction

This document provides a comprehensive guide for integrating the **Hedera Game Backend API** into your Unreal Engine game. This backend enables decentralized features, allowing players to connect their Hedera wallets and mint exclusive in-game NFTs on the Hedera testnet.

By following this guide, you will be able to:

-   Communicate with the backend API from your Unreal Engine game.
-   Implement wallet connection functionality for players.
-   Trigger the minting of exclusive NFTs for eligible players.
-   Verify NFT ownership and display asset details in-game.

## 2. Prerequisites

Before you begin, ensure you have the following:

1.  **Unreal Engine Project**: A working Unreal Engine project (C++ or Blueprint-based).
2.  **HTTP Plugin**: The `HTTP` module must be enabled in your Unreal Engine project. This is required to make REST API calls.
    -   To enable it, open your project's `.uproject` file and ensure the `HTTP` plugin is enabled, or add `"Http"` to the `PrivateDependencyModuleNames` in your game's `Build.cs` file.
3.  **JSON Plugin**: A plugin for handling JSON data. The built-in `Json` and `JsonUtilities` modules are sufficient.
4.  **Running Backend**: The Hedera Game Backend must be running and accessible from your development machine. Refer to the `README.md` for setup instructions.

## 3. API Overview

The backend exposes a RESTful API over HTTP. All communication is done using JSON. The base URL of the API depends on where the backend is hosted. For local testing, this will typically be `http://localhost:3000`.

### Key Endpoints

| Endpoint                      | Method | Description                                      |
| ----------------------------- | ------ | ------------------------------------------------ |
| `/api/wallet/connect`         | `POST` | Connects and verifies a player's Hedera wallet.  |
| `/api/nft/eligibility/:id`    | `GET`  | Checks if a player is eligible to mint an NFT.   |
| `/api/nft/mint`               | `POST` | Mints a new exclusive NFT for the player.        |
| `/api/nft/collection/info`    | `GET`  | Retrieves details about the game's NFT collection.|
| `/api/nft/:tokenId/:serial`   | `GET`  | Retrieves details for a specific NFT.            |

--- 

## 4. API Endpoint Reference

### 4.1. Connect Wallet

Verifies that a player's Hedera account ID is valid and exists on the network.

-   **Endpoint**: `POST /api/wallet/connect`
-   **Request Body**:

    ```json
    {
      "accountId": "0.0.12345"
    }
    ```

-   **Success Response (200 OK)**:

    ```json
    {
      "success": true,
      "message": "Wallet connected successfully",
      "data": {
        "accountId": "0.0.12345",
        "balance": 1500000000, // in tinybars
        "alias": null,
        "evmAddress": "0x..."
      }
    }
    ```

-   **Error Responses**:
    -   `400 Bad Request`: Invalid or missing `accountId`.
    -   `404 Not Found`: The `accountId` does not exist on the Hedera network.
    -   `500 Internal Server Error`: A server-side error occurred.

### 4.2. Check Minting Eligibility

Checks if a player is eligible to receive the exclusive game asset.

-   **Endpoint**: `GET /api/nft/eligibility/:accountId`
-   **URL Parameter**:
    -   `accountId`: The player's Hedera account ID (e.g., `0.0.12345`).
-   **Success Response (200 OK)**:

    ```json
    {
        "success": true,
        "eligible": true,
        "data": {
            "accountId": "0.0.12345",
            "alreadyOwnsNFT": false,
            "ownedNFTCount": 0,
            "reason": "Account is eligible to mint exclusive game asset"
        }
    }
    ```

### 4.3. Mint NFT

Mints a new NFT and associates it with the player's account. The backend handles the minting process; the game client only needs to provide the player's account ID.

-   **Endpoint**: `POST /api/nft/mint`
-   **Request Body**:

    ```json
    {
      "accountId": "0.0.12345",
      "assetName": "Legendary Sword of Hedera",
      "attributes": {
        "level": 10,
        "rarity": "Legendary"
      }
    }
    ```

-   **Success Response (201 Created)**:

    ```json
    {
      "success": true,
      "message": "NFT minted successfully",
      "data": {
        "tokenId": "0.0.56789",
        "serialNumber": "1",
        "transactionId": "0.0.12345@1678886400.123456789",
        "recipient": "0.0.12345",
        "assetName": "Legendary Sword of Hedera",
        "metadata": { ... },
        "explorerUrl": "https://hashscan.io/testnet/token/0.0.56789/1"
      }
    }
    ```

-   **Error Responses**:
    -   `400 Bad Request`: Missing `accountId` or `assetName`.
    -   `404 Not Found`: The `accountId` does not exist.
    -   `500 Internal Server Error`: Minting failed (e.g., player not associated with the token, treasury account out of HBAR, etc.).

--- 

## 5. Unreal Engine Implementation (C++ Example)

Here is a basic C++ example of how to create a service in Unreal Engine to communicate with the backend API. This can be adapted into Blueprint-callable functions.

#### **HederaApi.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "Http.h"
#include "UObject/NoExportTypes.h"
#include "HederaApi.generated.h"

UCLASS()
class YOURGAME_API UHederaApi : public UObject
{
    GENERATED_BODY()

public:
    UHederaApi();

    // Function to connect a Hedera wallet
    void ConnectWallet(const FString& AccountId);

    // Function to mint an NFT
    void MintNFT(const FString& AccountId, const FString& AssetName);

private:
    FString ApiBaseUrl = TEXT("http://localhost:3000/api");

    void OnConnectWalletResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful);
    void OnMintNFTResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful);
};
```

#### **HederaApi.cpp**

```cpp
#include "HederaApi.h"
#include "Json.h"
#include "JsonUtilities.h"

UHederaApi::UHederaApi()
{
}

void UHederaApi::ConnectWallet(const FString& AccountId)
{
    FHttpModule* Http = &FHttpModule::Get();
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = Http->CreateRequest();

    Request->SetURL(ApiBaseUrl + TEXT("/wallet/connect"));
    Request->SetVerb("POST");
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));

    // Create request body
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("accountId"), AccountId);

    FString RequestBody;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&RequestBody);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    Request->SetContentAsString(RequestBody);
    Request->OnProcessRequestComplete().BindUObject(this, &UHederaApi::OnConnectWalletResponse);
    Request->ProcessRequest();
}

void UHederaApi::MintNFT(const FString& AccountId, const FString& AssetName)
{
    FHttpModule* Http = &FHttpModule::Get();
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = Http->CreateRequest();

    Request->SetURL(ApiBaseUrl + TEXT("/nft/mint"));
    Request->SetVerb("POST");
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));

    // Create request body
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("accountId"), AccountId);
    JsonObject->SetStringField(TEXT("assetName"), AssetName);
    // You can add more attributes here if needed
    TSharedPtr<FJsonObject> AttributesObject = MakeShareable(new FJsonObject);
    AttributesObject->SetNumberField(TEXT("level"), 1);
    JsonObject->SetObjectField(TEXT("attributes"), AttributesObject);

    FString RequestBody;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&RequestBody);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    Request->SetContentAsString(RequestBody);
    Request->OnProcessRequestComplete().BindUObject(this, &UHederaApi::OnMintNFTResponse);
    Request->ProcessRequest();
}

void UHederaApi::OnConnectWalletResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
{
    if (bWasSuccessful && Response.IsValid() && EHttpResponseCodes::IsOk(Response->GetResponseCode()))
    {
        UE_LOG(LogTemp, Warning, TEXT("Wallet connected successfully: %s"), *Response->GetContentAsString());
        // TODO: Parse the JSON response and update game state
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("Wallet connection failed. Response: %s"), *Response->GetContentAsString());
    }
}

void UHederaApi::OnMintNFTResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
{
    if (bWasSuccessful && Response.IsValid() && Response->GetResponseCode() == 201)
    {
        UE_LOG(LogTemp, Warning, TEXT("NFT minted successfully: %s"), *Response->GetContentAsString());
        // TODO: Parse the JSON response and grant the item to the player in-game
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("NFT minting failed. Response: %s"), *Response->GetContentAsString());
    }
}
```

## 6. Example In-Game Workflow

1.  **UI for Wallet Input**: Create a UMG widget that allows the player to input their Hedera Account ID (e.g., `0.0.12345`).

2.  **Connect Button**: When the player clicks "Connect", call the `ConnectWallet` function with the provided Account ID.

3.  **Handle Response**: In the `OnConnectWalletResponse` callback:
    -   If successful, store the player's `accountId` and display a "Connected" status.
    -   If it fails, display an appropriate error message to the player (e.g., "Invalid Account ID" or "Could not verify account").

4.  **Check Eligibility**: After successful connection, make a `GET` request to `/api/nft/eligibility/:accountId`.
    -   If `eligible` is `true`, enable the "Mint Exclusive Asset" button in the UI.
    -   If `eligible` is `false` (e.g., `alreadyOwnsNFT` is `true`), disable the button and show a message like "You already own this asset!".

5.  **Minting**: When the player clicks the minting button, call the `MintNFT` function.

6.  **Grant Item**: In the `OnMintNFTResponse` callback:
    -   If successful, parse the response to get the `tokenId` and `serialNumber`.
    -   Add the new asset to the player's in-game inventory, linking it with the NFT data.
    -   Display a success message with a link to the transaction on HashScan (`explorerUrl`).

## 7. Security Considerations

-   **No Private Keys in Client**: The game client should **never** handle private keys. All cryptographic operations are managed by the backend.
-   **Input Validation**: The backend performs validation, but it's good practice to do basic format checking for the `accountId` in the game client as well.
-   **HTTPS**: For a production environment, ensure the backend is served over HTTPS to protect data in transit.
-   **Rate Limiting**: The backend has rate limiting to prevent abuse. Ensure your game client does not send an excessive number of requests.

