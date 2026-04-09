/**
 * @fileoverview Managed Identity token provider using @azure/identity
 */

import { ITokenProvider, API_HUB_SCOPES } from './tokenProvider';
import { DefaultAzureCredential, ManagedIdentityCredential } from '@azure/identity';

/**
 * Token provider using Azure Managed Identity.
 * This is the primary auth model for production workloads.
 */
export class ManagedIdentityTokenProvider implements ITokenProvider {
    private readonly _credential: DefaultAzureCredential | ManagedIdentityCredential;

    /**
     * Initializes a new ManagedIdentityTokenProvider.
     * @param clientId Optional client ID for user-assigned managed identity.
     *                 If omitted, uses DefaultAzureCredential (system-assigned or environment-based).
     */
    constructor(clientId?: string) {
        if (clientId) {
            this._credential = new ManagedIdentityCredential(clientId);
        } else {
            this._credential = new DefaultAzureCredential();
        }
    }

    /**
     * Gets an authentication token using managed identity.
     * @param scopes Optional scopes. Defaults to API Hub scopes.
     */
    public async getToken(scopes?: string[]): Promise<string> {
        const requestScopes = scopes ?? API_HUB_SCOPES;
        if (requestScopes.length === 0) {
            throw new Error('At least one scope must be provided.');
        }
        const token = await this._credential.getToken(requestScopes);
        if (!token) {
            throw new Error('Failed to acquire token from managed identity.');
        }
        return token.token;
    }

    /**
     * Refreshes the authentication token.
     * @param scopes Optional scopes. Defaults to API Hub scopes.
     */
    public async refreshToken(scopes?: string[]): Promise<string> {
        return await this.getToken(scopes);
    }
}
