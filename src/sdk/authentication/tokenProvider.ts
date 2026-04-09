/**
 * @fileoverview Token provider interface for authentication
 */

/**
 * Interface for providing authentication tokens.
 */
export interface ITokenProvider {
    /**
     * Gets an authentication token.
     * @param scopes Optional scopes for the token request.
     */
    getToken(scopes?: string[]): Promise<string>;

    /**
     * Refreshes the authentication token if needed.
     * @param scopes Optional scopes for the token request.
     */
    refreshToken(scopes?: string[]): Promise<string>;
}