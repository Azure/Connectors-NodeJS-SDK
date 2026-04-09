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
    private readonly _connectionRuntimeUrl?: string;
    private _disposed: boolean = false;

    /**
     * Initializes a new instance of the ConnectorClientBase class.
     * @param connectionRuntimeUrl The connection runtime URL for the connector endpoint. Pass undefined to use options.baseUrl.
     * @param tokenProvider The token provider for authentication.
     * @param options The connector client options.
     */
    protected constructor(
        connectionRuntimeUrl: string | undefined,
        tokenProvider: ITokenProvider,
        options?: ConnectorClientOptions
    ) {
        if (!tokenProvider) {
            throw new Error('Token provider is required');
        }

        this._connectionRuntimeUrl = connectionRuntimeUrl;
        const clientOptions = options ?? new ConnectorClientOptions();
        if (connectionRuntimeUrl && !clientOptions.baseUrl) {
            clientOptions.baseUrl = connectionRuntimeUrl;
        }
        this._httpClient = new HttpClient(tokenProvider, clientOptions);
    }

    /**
     * Gets the connector name.
     */
    public abstract readonly connectorName: string;

    /**
     * Gets the connection runtime URL.
     */
    protected get connectionRuntimeUrl(): string | undefined {
        return this._connectionRuntimeUrl;
    }

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
     * Convenience GET that auto-deserializes the response body.
     * @param path The API path.
     * @param headers Additional headers.
     * @param options Additional request options.
     */
    protected async getAsync<T>(
        path: string,
        headers?: Record<string, string>,
        options?: any
    ): Promise<T> {
        const response = await this.callConnectorAsync<T>('GET', path, undefined, headers, options);
        return response.data;
    }

    /**
     * Convenience POST that auto-deserializes the response body.
     * @param path The API path.
     * @param body The request body.
     * @param headers Additional headers.
     * @param options Additional request options.
     */
    protected async postAsync<T>(
        path: string,
        body?: any,
        headers?: Record<string, string>,
        options?: any
    ): Promise<T> {
        const response = await this.callConnectorAsync<T>('POST', path, body, headers, options);
        return response.data;
    }

    /**
     * Convenience DELETE with no response body.
     * @param path The API path.
     * @param headers Additional headers.
     * @param options Additional request options.
     */
    protected async deleteAsync(
        path: string,
        headers?: Record<string, string>,
        options?: any
    ): Promise<void> {
        await this.callConnectorAsync('DELETE', path, undefined, headers, options);
    }

    /**
     * Convenience PATCH that auto-deserializes the response body.
     * @param path The API path.
     * @param body The request body.
     * @param headers Additional headers.
     * @param options Additional request options.
     */
    protected async patchAsync<T>(
        path: string,
        body?: any,
        headers?: Record<string, string>,
        options?: any
    ): Promise<T> {
        const response = await this.callConnectorAsync<T>('PATCH', path, body, headers, options);
        return response.data;
    }

    /**
     * Convenience PUT that auto-deserializes the response body.
     * @param path The API path.
     * @param body The request body.
     * @param headers Additional headers.
     * @param options Additional request options.
     */
    protected async putAsync<T>(
        path: string,
        body?: any,
        headers?: Record<string, string>,
        options?: any
    ): Promise<T> {
        const response = await this.callConnectorAsync<T>('PUT', path, body, headers, options);
        return response.data;
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