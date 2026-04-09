/**
 * @fileoverview Connection string / API key token provider
 */

import { ITokenProvider } from './tokenProvider';

/**
 * Token provider using a pre-configured API key or connection string.
 * Useful for scenarios where tokens are pre-provisioned.
 */
export class ConnectionStringTokenProvider implements ITokenProvider {
    private readonly _apiKey: string;

    /**
     * Initializes a new ConnectionStringTokenProvider.
     * @param apiKey The API key or connection string.
     */
    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error('API key cannot be null or empty.');
        }
        this._apiKey = apiKey;
    }

    /**
     * Returns the API key directly (no token acquisition needed).
     * @param _scopes Ignored for connection string auth.
     */
    public async getToken(_scopes?: string[]): Promise<string> {
        return this._apiKey;
    }

    /**
     * Returns the API key directly (no refresh needed).
     * @param _scopes Ignored for connection string auth.
     */
    public async refreshToken(_scopes?: string[]): Promise<string> {
        return this._apiKey;
    }
}
