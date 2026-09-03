// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Authentication token providers for connector clients.
 *
 * Provides compatibility credentials for managed identity and API key authentication.
 */

import type { AccessToken, GetTokenOptions, TokenCredential } from "@azure/core-auth";
import { DefaultAzureCredential, ManagedIdentityCredential } from "@azure/identity";

/**
 * Token provider using Azure Managed Identity.
 */
export class ManagedIdentityTokenProvider implements TokenCredential {
    private readonly credential: TokenCredential;

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

    /**
     * Gets an access token from the configured Azure Identity credential.
     * @param scopes The authentication scopes.
     * @param options Optional token request settings.
     */
    public async getToken(
        scopes: string | string[],
        options?: GetTokenOptions,
    ): Promise<AccessToken | null> {
        if (!scopes || (Array.isArray(scopes) && scopes.length === 0)) {
            throw new Error("At least one scope must be provided.");
        }

        return this.credential.getToken(scopes, options);
    }
}

/**
 * Token provider using a pre-configured API key or connection string.
 */
export class ConnectionStringTokenProvider implements TokenCredential {
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

    /**
     * Gets a non-expiring access token containing the configured API key.
     * @param _scopes The authentication scopes.
     * @param _options Optional token request settings.
     */
    public async getToken(
        _scopes: string | string[],
        _options?: GetTokenOptions,
    ): Promise<AccessToken> {
        return {
            token: this.apiKey,
            expiresOnTimestamp: Number.MAX_SAFE_INTEGER,
        };
    }
}
