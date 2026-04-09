/**
 * @fileoverview MSAL-based token provider implementation
 */

import { ITokenProvider } from './tokenProvider';
import { ConfidentialClientApplication, ClientCredentialRequest, AuthenticationResult } from '@azure/msal-node';

/**
 * Configuration for MSAL token provider.
 */
export interface MsalTokenProviderConfig {
    /**
     * The Azure AD tenant ID.
     */
    tenantId: string;

    /**
     * The client (application) ID.
     */
    clientId: string;

    /**
     * The client secret.
     */
    clientSecret: string;

    /**
     * The authority URL. Defaults to Azure public cloud.
     */
    authority?: string;

    /**
     * Default scopes to request.
     */
    defaultScopes?: string[];
}

/**
 * MSAL-based token provider for Azure AD authentication.
 */
export class MsalTokenProvider implements ITokenProvider {
    private readonly _client: ConfidentialClientApplication;
    private readonly _defaultScopes: string[];
    private _cachedToken: AuthenticationResult | null = null;

    constructor(config: MsalTokenProviderConfig) {
        this._defaultScopes = config.defaultScopes ?? ['https://graph.microsoft.com/.default'];

        const clientConfig = {
            auth: {
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                authority: config.authority ?? `https://login.microsoftonline.com/${config.tenantId}`,
            },
        };

        this._client = new ConfidentialClientApplication(clientConfig);
    }

    /**
     * Gets an authentication token.
     * @param scopes Optional scopes for the token request.
     */
    public async getToken(scopes?: string[]): Promise<string> {
        const requestScopes = scopes ?? this._defaultScopes;

        // Check if we have a cached token that's still valid
        if (this._cachedToken && this.isTokenValid(this._cachedToken)) {
            return this._cachedToken.accessToken;
        }

        // Get a new token
        const clientCredentialRequest: ClientCredentialRequest = {
            scopes: requestScopes,
        };

        try {
            const response = await this._client.acquireTokenByClientCredential(clientCredentialRequest);
            if (response) {
                this._cachedToken = response;
                return response.accessToken;
            } else {
                throw new Error('Failed to acquire token: No response received');
            }
        } catch (error) {
            throw new Error(`Failed to acquire token: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Refreshes the authentication token.
     * @param scopes Optional scopes for the token request.
     */
    public async refreshToken(scopes?: string[]): Promise<string> {
        // Clear cached token to force refresh
        this._cachedToken = null;
        return await this.getToken(scopes);
    }

    /**
     * Checks if a token is still valid.
     * @param token The token to check.
     */
    private isTokenValid(token: AuthenticationResult): boolean {
        if (!token.expiresOn) {
            return false;
        }

        // Consider token invalid if it expires within the next 5 minutes
        const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        const expirationTime = token.expiresOn.getTime() - bufferTime;
        const currentTime = Date.now();

        return currentTime < expirationTime;
    }
}