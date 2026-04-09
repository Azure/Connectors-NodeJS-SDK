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

        try {
            const response: AxiosResponse<T> = await this._axiosInstance.request(config);
            
            return new ConnectorResponse<T>(
                response.data,
                response.status,
                response.statusText,
                this.normalizeHeaders(response.headers),
                response
            );
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status ?? 0;
                const statusText = error.response?.statusText ?? 'Unknown Error';
                const responseBody = error.response?.data;
                
                throw new ConnectorException(
                    error.message,
                    status,
                    statusText,
                    responseBody
                );
            }
            throw error;
        }
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

        try {
            const response: AxiosResponse<ArrayBuffer> = await this._axiosInstance.request(config);
            const buffer = Buffer.from(response.data);
            
            return new ConnectorResponse<Buffer>(
                buffer,
                response.status,
                response.statusText,
                this.normalizeHeaders(response.headers),
                response
            );
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status ?? 0;
                const statusText = error.response?.statusText ?? 'Unknown Error';
                const responseBody = error.response?.data;
                
                throw new ConnectorException(
                    error.message,
                    status,
                    statusText,
                    responseBody
                );
            }
            throw error;
        }
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