/**
 * Test client for testing abstract base class functionality
 */

import { ConnectorClientBase } from '../../src/sdk/base/connectorClientBase';
import { ConnectorClientOptions } from '../../src/sdk/base/connectorClientOptions';
import { ITokenProvider } from '../../src/sdk/authentication/tokenProvider';
import { ConnectorResponse } from '../../src/sdk/base/connectorResponse';
import { HttpClient } from '../../src/sdk/utils/httpClient';

/**
 * Concrete test implementation of ConnectorClientBase for testing purposes
 */
export class TestClient extends ConnectorClientBase {
    /**
     * Required implementation of abstract connectorName property
     */
    public readonly connectorName: string = 'test-connector';

    /**
     * Public constructor for testing (makes protected constructor accessible)
     */
    constructor(tokenProvider: ITokenProvider, options?: ConnectorClientOptions) {
        super(undefined, tokenProvider, options);
    }

    /**
     * Expose the protected callConnectorAsync method for testing
     */
    public async testCallConnectorAsync<T>(
        method: string,
        path: string,
        body?: any,
        headers?: Record<string, string>,
        options?: any
    ): Promise<ConnectorResponse<T>> {
        return this.callConnectorAsync<T>(method, path, body, headers, options);
    }

    /**
     * Expose the protected callConnectorBinaryAsync method for testing
     */
    public async testCallConnectorBinaryAsync(
        method: string,
        path: string,
        body?: any,
        headers?: Record<string, string>,
        options?: any
    ): Promise<ConnectorResponse<Buffer>> {
        return this.callConnectorBinaryAsync(method, path, body, headers, options);
    }

    /**
     * Expose the protected httpClient for testing
     */
    public get testHttpClient(): HttpClient {
        return this.httpClient;
    }

    /**
     * Expose the public dispose method for testing
     */
    public async testDispose(): Promise<void> {
        return this.dispose();
    }
}