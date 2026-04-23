// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Authentication token providers for connector clients.
 *
 * Mirrors the Python SDK's authentication.py — provides a TokenProvider interface
 * and concrete implementations for Managed Identity and API key authentication.
 */

import { DefaultAzureCredential, ManagedIdentityCredential } from "@azure/identity";

/**
 * Interface for providing authentication tokens.
 */
export interface TokenProvider {
    /**
     * Gets an access token for the specified scopes.
     * @param scopes The authentication scopes.
     */
    getAccessTokenAsync(scopes: string[]): Promise<string>;
}

/**
 * Token provider using Azure Managed Identity.
 */
export class ManagedIdentityTokenProvider implements TokenProvider {
    private readonly credential: DefaultAzureCredential | ManagedIdentityCredential;

    /**
     * Initializes a new ManagedIdentityTokenProvider.
     * @param clientId Optional client ID for user-assigned managed identity.
     */
    constructor(clientId?: string) {
        if (clientId) {
            this.credential = new ManagedIdentityCredential(clientId);
        } else {
            this.credential = new DefaultAzureCredential();
        }
    }

    public async getAccessTokenAsync(scopes: string[]): Promise<string> {
        if (!scopes || scopes.length === 0) {
            throw new Error("At least one scope must be provided.");
        }

        const token = await this.credential.getToken(scopes);
        if (!token) {
            throw new Error("Failed to acquire access token.");
        }

        return token.token;
    }
}

/**
 * Token provider using a pre-configured API key or connection string.
 */
export class ConnectionStringTokenProvider implements TokenProvider {
    private readonly apiKey: string;

    /**
     * Initializes a new ConnectionStringTokenProvider.
     * @param apiKey The API key or connection string.
     */
    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error("API key cannot be null or empty.");
        }

        this.apiKey = apiKey;
    }

    public async getAccessTokenAsync(_scopes: string[]): Promise<string> {
        return this.apiKey;
    }
}
