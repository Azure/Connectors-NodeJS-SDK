/**
 * @fileoverview Abstract base class for generated connector clients
 */

import { IConnectorClient } from './iConnectorClient';
import { ConnectorClientOptions } from './connectorClientOptions';
import { ConnectorResponse } from './connectorResponse';
import { ITokenProvider } from '../authentication/tokenProvider';
import { HttpClient } from '../utils/httpClient';

/**
 * Abstract base class for generated connector clients.
 */
export abstract class ConnectorClientBase implements IConnectorClient {
    private readonly _httpClient: HttpClient;
    private _disposed: boolean = false;

    /**
     * Initializes a new instance of the ConnectorClientBase class.
     * @param tokenProvider The token provider for authentication.
     * @param options The connector client options.
     */
    protected constructor(
        tokenProvider: ITokenProvider,
        options?: ConnectorClientOptions
    ) {
        if (!tokenProvider) {
            throw new Error('Token provider is required');
        }

        const clientOptions = options ?? new ConnectorClientOptions();
        this._httpClient = new HttpClient(tokenProvider, clientOptions);
    }

    /**
     * Gets the connector name.
     */
    public abstract readonly connectorName: string;

    /**
     * Gets the HTTP client for making connector requests.
     */
    protected get httpClient(): HttpClient {
        this.ensureNotDisposed();
        return this._httpClient;
    }

    /**
     * Makes a connector API call.
     * @param method The HTTP method.
     * @param path The API path.
     * @param body The request body.
     * @param headers Additional headers.
     * @param options Additional request options.
     */
    protected async callConnectorAsync<T>(
        method: string,
        path: string,
        body?: any,
        headers?: Record<string, string>,
        options?: any
    ): Promise<ConnectorResponse<T>> {
        this.ensureNotDisposed();
        return await this._httpClient.request<T>(method, path, body, headers, options);
    }

    /**
     * Makes a connector API call that returns binary data.
     * @param method The HTTP method.
     * @param path The API path.
     * @param body The request body.
     * @param headers Additional headers.
     * @param options Additional request options.
     */
    protected async callConnectorBinaryAsync(
        method: string,
        path: string,
        body?: any,
        headers?: Record<string, string>,
        options?: any
    ): Promise<ConnectorResponse<Buffer>> {
        this.ensureNotDisposed();
        return await this._httpClient.requestBinary(method, path, body, headers, options);
    }

    /**
     * Disposes the connector client and releases resources.
     */
    public async dispose(): Promise<void> {
        if (!this._disposed) {
            await this._httpClient.dispose();
            this._disposed = true;
        }
    }

    /**
     * Ensures the client is not disposed.
     */
    private ensureNotDisposed(): void {
        if (this._disposed) {
            throw new Error('ConnectorClient has been disposed');
        }
    }
}