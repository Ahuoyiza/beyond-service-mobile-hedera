# Unreal Engine Integration Guide for Hedera Game Backend

**Project: Beyond Service**
**Version: 1.0.0**

## 1. Introduction

This document provides a comprehensive guide for integrating the **Hedera Game Backend API** into Unreal Engine game, **Beyond Service**. This backend enables decentralized features, allowing players to connect their Hedera wallets and mint exclusive in-game NFTs on the Hedera testnet.

By following this guide, you will be able to:

-   Communicate with the live backend API from your Unreal Engine game.
-   Implement secure authentication using the required API Key.
-   Implement wallet connection functionality for players.
-   Trigger the minting of exclusive NFTs for eligible players.
-   Verify NFT ownership and display asset details in-game.

## 2. Prerequisites

Before you begin, ensure you have the following:

1.  **Unreal Engine Project**: A working Unreal Engine project (C++ or Blueprint-based).
2.  **HTTP Plugin**: The `HTTP` module must be enabled in your Unreal Engine project.
3.  **JSON Plugin**: The built-in `Json` and `JsonUtilities` modules are sufficient for handling JSON data.
4.  **Live Backend**: The Hedera Game Backend is live and accessible at `https://beyond-service-mobile-hedera-production.up.railway.app`. All requests must use the provided `GAME-API-Key` for authentication.

## 3. API Overview

The backend exposes a RESTful API over HTTP. All communication is done using JSON.

### Key Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/wallet/connect` | `POST` | Connects and verifies a player's Hedera wallet. |
| `/api/nft/eligibility/:id` | `GET` | Checks if a player is eligible to mint an NFT. |
| `/api/nft/mint` | `POST` | Mints a new exclusive NFT for the player. |
| `/api/nft/collection/info` | `GET` | Retrieves details about the game's NFT collection. |
| `/api/nft/:tokenId/:serial` | `GET` | Retrieves details for a specific NFT. |

--- 

## 4. Unreal Engine Implementation (C++ Example)

Here is a basic C++ example of how to create a service in Unreal Engine to communicate with the live backend API, including the necessary API Key authentication.

### 4.1. HederaApi.h (Header File)

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

    // Function to set the API Key and Base URL
    void Initialize(const FString& ApiKey, const FString& BaseUrl);

    // Function to connect a Hedera wallet
    void ConnectWallet(const FString& AccountId);

    // Function to mint an NFT
    void MintNFT(const FString& AccountId, const FString& AssetName);

private:
    FString ApiBaseUrl;
    FString ApiKey;

    void OnConnectWalletResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful);
    void OnMintNFTResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful);
};
```

### 4.2. HederaApi.cpp (Source File)

```cpp
#include "HederaApi.h"
#include "Json.h"
#include "JsonUtilities.h"

UHederaApi::UHederaApi()
{
}

void UHederaApi::Initialize(const FString& ApiKeyIn, const FString& BaseUrlIn)
{
    ApiKey = ApiKeyIn;
    ApiBaseUrl = BaseUrlIn;
}

void UHederaApi::ConnectWallet(const FString& AccountId)
{
    FHttpModule* Http = &FHttpModule::Get();
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = Http->CreateRequest();

    Request->SetURL(ApiBaseUrl + TEXT("/api/wallet/connect"));
    Request->SetVerb("POST");
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetHeader(TEXT("X-API-Key"), ApiKey); // <-- API Key for authentication

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

    Request->SetURL(ApiBaseUrl + TEXT("/api/nft/mint"));
    Request->SetVerb("POST");
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetHeader(TEXT("X-API-Key"), ApiKey); // <-- API Key for authentication

    // Create request body
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("accountId"), AccountId);
    JsonObject->SetStringField(TEXT("assetName"), AssetName);
    // You can add more attributes here if needed
    TSharedPtr<FJsonObject> AttributesObject = MakeShareShareable(new FJsonObject);
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

### 4.3. Usage Example in Player Controller

This example shows how to initialize the API service with the live URL and the API Key.

```cpp
// Example of usage in a Player Controller or Game Instance
void AMyPlayerController::InitializeHederaIntegration()
{
    // Create the Hedera API service
    HederaApiService = NewObject<UHederaApi>();
    
    // --- IMPORTANT: Initialize the API with the live URL and API Key ---
    const FString LiveApiUrl = TEXT("https://beyond-service-mobile-hedera.railway.internal");
    
    // The API Key must be obtained from the internal API team.
    const FString SecretApiKey = TEXT("REACH_OUT_TO_API_TEAM_FOR_KEY"); 
    
    HederaApiService->Initialize(SecretApiKey, LiveApiUrl);
    
    // Check if wallet was previously connected
    FString SavedAccountId = LoadAccountIdFromSave();
    
    if (!SavedAccountId.IsEmpty())
    {
        // Auto-connect with saved account
        HederaApiService->ConnectWallet(SavedAccountId);
    }
    else
    {
        // Show wallet connection UI
        ShowWalletConnectionScreen();
    }
}
```

---

## 5. Example In-Game Workflow

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

--- 

## 6. Security Considerations

-   **API Key**: The `X-API-Key` is mandatory for all requests to the live API. **The game development team must contact the API team to obtain the correct key.**
-   **No Private Keys in Client**: The game client should **never** handle private keys. All cryptographic operations are managed by the backend.
-   **Input Validation**: The backend performs validation, but it's good practice to do basic format checking for the `accountId` in the game client as well.
-   **HTTPS**: The Railway deployment uses HTTPS, ensuring data is protected in transit.
-   **Rate Limiting**: The backend has rate limiting to prevent abuse.

---

