/**
 * @fileoverview HTTP client for connector API calls
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ITokenProvider } from '../authentication/tokenProvider';
import { ConnectorClientOptions } from '../base/connectorClientOptions';
import { ConnectorResponse } from '../base/connectorResponse';
import { ConnectorException } from './exceptions';

/**
 * HTTP client for making connector API requests.
 */
export class HttpClient {
    private readonly _axiosInstance: AxiosInstance;
    private readonly _tokenProvider: ITokenProvider;
    private readonly _options: ConnectorClientOptions;

    constructor(tokenProvider: ITokenProvider, options: ConnectorClientOptions) {
        this._tokenProvider = tokenProvider;
        this._options = options;

        this._axiosInstance = axios.create({
            baseURL: options.baseUrl,
            timeout: options.timeout,
            headers: {
                'User-Agent': options.userAgent,
                'Content-Type': 'application/json',
                ...options.defaultHeaders,
            },
            ...options.httpAgentOptions,
        });

        this.setupInterceptors();
    }

    /**
     * Makes an HTTP request and returns structured data.
     * @param method The HTTP method.
     * @param path The API path.
     * @param body The request body.
     * @param headers Additional headers.
     * @param options Additional request options.
     */
    public async request<T>(
        method: string,
        path: string,
        body?: any,
        headers?: Record<string, string>,
        options?: any
    ): Promise<ConnectorResponse<T>> {
        const config: AxiosRequestConfig = {
            method: method.toUpperCase() as any,
            url: path,
            data: body,
            headers: {
                ...headers,
            },
            ...options,
        };

        return await this.sendWithRetry<T>(config, false);
    }

    /**
     * Makes an HTTP request and returns binary data.
     * @param method The HTTP method.
     * @param path The API path.
     * @param body The request body.
     * @param headers Additional headers.
     * @param options Additional request options.
     */
    public async requestBinary(
        method: string,
        path: string,
        body?: any,
        headers?: Record<string, string>,
        options?: any
    ): Promise<ConnectorResponse<Buffer>> {
        const config: AxiosRequestConfig = {
            method: method.toUpperCase() as any,
            url: path,
            data: body,
            headers: {
                ...headers,
            },
            responseType: 'arraybuffer',
            ...options,
        };

        return await this.sendWithRetry<Buffer>(config, true);
    }

    /**
     * Sends a request with retry logic for transient failures (429, 5xx).
     */
    private async sendWithRetry<T>(config: AxiosRequestConfig, isBinary: boolean): Promise<ConnectorResponse<T>> {
        const maxAttempts = this._options.maxRetryAttempts ?? 3;
        let lastError: any;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response: AxiosResponse = await this._axiosInstance.request(config);

                if (isBinary) {
                    const buffer = Buffer.from(response.data) as any;
                    return new ConnectorResponse<T>(
                        buffer,
                        response.status,
                        response.statusText,
                        this.normalizeHeaders(response.headers),
                        response
                    );
                }

                return new ConnectorResponse<T>(
                    response.data,
                    response.status,
                    response.statusText,
                    this.normalizeHeaders(response.headers),
                    response
                );
            } catch (error) {
                lastError = error;

                // Check if this is a retryable error
                if (axios.isAxiosError(error)) {
                    const status = error.response?.status ?? 0;
                    const isRetryable = status === 429 || status >= 500;

                    if (isRetryable && attempt < maxAttempts - 1) {
                        await this.delayRetry(attempt);
                        continue;
                    }

                    // Non-retryable or last attempt — throw ConnectorException
                    const statusText = error.response?.statusText ?? 'Unknown Error';
                    const responseBody = error.response?.data;
                    throw new ConnectorException(
                        error.message,
                        status,
                        statusText,
                        responseBody
                    );
                }

                // Non-Axios errors get a retry for network-level failures
                if (attempt < maxAttempts - 1) {
                    await this.delayRetry(attempt);
                    continue;
                }
                throw error;
            }
        }

        // Should not reach here, but safety net
        throw lastError;
    }

    /**
     * Calculates and applies retry delay with optional exponential backoff.
     */
    private delayRetry(attempt: number): Promise<void> {
        let delay: number;
        if (this._options.useExponentialBackoff) {
            delay = (this._options.initialRetryDelayMs ?? 500) * Math.pow(2, attempt);
        } else {
            delay = this._options.retryDelayMs ?? 1000;
        }
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Disposes the HTTP client.
     */
    public async dispose(): Promise<void> {
        // No specific cleanup needed for axios
    }

    /**
     * Sets up request and response interceptors.
     */
    private setupInterceptors(): void {
        // Request interceptor to add authentication token
        this._axiosInstance.interceptors.request.use(
            async (config) => {
                try {
                    const token = await this._tokenProvider.getToken();
                    config.headers = config.headers || {};
                    config.headers.Authorization = `Bearer ${token}`;
                } catch (error) {
                    console.error('Failed to get authentication token:', error);
                    throw error;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor for logging and error handling
        this._axiosInstance.interceptors.response.use(
            (response) => {
                if (this._options.enableLogging) {
                    console.log(`HTTP ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
                }
                return response;
            },
            async (error) => {
                if (this._options.enableLogging) {
                    console.error(`HTTP Error: ${error.message}`);
                }

                // Handle 401 unauthorized - attempt token refresh
                if (error.response?.status === 401) {
                    try {
                        await this._tokenProvider.refreshToken();
                        // Retry the original request
                        const originalRequest = error.config;
                        if (originalRequest && !originalRequest._retryAttempted) {
                            originalRequest._retryAttempted = true;
                            const token = await this._tokenProvider.getToken();
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return this._axiosInstance.request(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * Normalizes response headers to a simple Record<string, string> format.
     * @param headers The response headers.
     */
    private normalizeHeaders(headers: any): Record<string, string> {
        const normalized: Record<string, string> = {};
        
        if (headers) {
            Object.keys(headers).forEach(key => {
                normalized[key.toLowerCase()] = String(headers[key]);
            });
        }
        
        return normalized;
    }
}