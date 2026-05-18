// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * HTTP client for connector operations with retry and authentication.
 *
 * Mirrors the Python SDK's http_client.py. Uses the Node.js built-in fetch API (Node 18+).
 */

import { TokenProvider } from "./authentication.ts";
import { ConnectorClientOptions, DefaultConnectorClientOptions } from "./options.ts";

/**
 * Represents a response from a connector operation.
 */
export interface ConnectorResponse<TValue = unknown> {
    /** The HTTP status code. */
    statusCode: number;

    /** The response headers. */
    headers: Record<string, string>;

    /** The response value. */
    value: TValue | undefined;

    /** The raw response text. */
    text: string;

    /** Check if the response indicates success. */
    isSuccessStatusCode: boolean;
}

/**
 * HTTP client for connector operations with retry and authentication.
 */
export class ConnectorHttpClient {
    private static readonly ApiHubScopes = ["https://apihub.azure.com/.default"];

    private readonly tokenProvider: TokenProvider;
    private readonly options: Required<ConnectorClientOptions>;

    /**
     * Initializes a ConnectorHttpClient.
     * @param tokenProvider The token provider for authentication.
     * @param options The client options.
     */
    constructor(tokenProvider: TokenProvider, options?: ConnectorClientOptions) {
        this.tokenProvider = tokenProvider;
        this.options = {
            ...DefaultConnectorClientOptions,
            ...options,
        };
    }

    /**
     * Sends an HTTP request with authentication and retry.
     * @param method The HTTP method.
     * @param url The request URL.
     * @param scopes The authentication scopes. Defaults to API Hub scopes.
     * @param body Optional request body (will be JSON-serialized).
     * @param abortSignal Optional abort signal for caller-initiated cancellation.
     */
    public async sendAsync<TValue = unknown>(
        method: string,
        url: string,
        scopes?: string[],
        body?: unknown,
        abortSignal?: AbortSignal,
    ): Promise<ConnectorResponse<TValue>> {
        const effectiveScopes = scopes ?? ConnectorHttpClient.ApiHubScopes;
        const token = await this.tokenProvider.getAccessTokenAsync(effectiveScopes);

        const headers: Record<string, string> = {
            "Authorization": `Bearer ${token}`,
        };

        const init: RequestInit = { method, headers };

        if (body !== undefined) {
            headers["Content-Type"] = "application/json";
            init.body = JSON.stringify(body);
        }

        return this.sendWithRetry<TValue>(url, init, 0, abortSignal);
    }

    /**
     * Sends request with retry logic.
     */
    private async sendWithRetry<TValue>(
        url: string,
        init: RequestInit,
        attempt: number,
        callerSignal?: AbortSignal,
    ): Promise<ConnectorResponse<TValue>> {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), this.options.timeoutMs);

        // NOTE(swapnilnagar): Merge caller-provided abort signal with the internal timeout controller.
        // When the caller aborts, abort the internal controller as well.
        const onCallerAbort = (): void => abortController.abort();
        if (callerSignal) {
            if (callerSignal.aborted) {
                abortController.abort();
            } else {
                callerSignal.addEventListener("abort", onCallerAbort, { once: true });
            }
        }

        try {
            const response = await fetch(url, { ...init, signal: abortController.signal });
            const text = await response.text();

            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((headerValue, headerKey) => {
                responseHeaders[headerKey] = headerValue;
            });

            let value: TValue | undefined;
            if (text) {
                try {
                    value = JSON.parse(text) as TValue;
                } catch {
                    value = undefined;
                }
            }

            return {
                statusCode: response.status,
                headers: responseHeaders,
                value,
                text,
                isSuccessStatusCode: response.ok,
            };
        } catch (error) {
            // Don't retry on non-transient programming errors.
            if (error instanceof TypeError || error instanceof SyntaxError) {
                throw error;
            }

            if (attempt < this.options.maxRetryAttempts - 1) {
                const delay = this.options.useExponentialBackoff
                    ? this.options.initialRetryDelayMs * Math.pow(2, attempt)
                    : this.options.initialRetryDelayMs;
                await new Promise<void>((resolve) => setTimeout(resolve, delay));
                return this.sendWithRetry<TValue>(url, init, attempt + 1, callerSignal);
            }

            throw error;
        } finally {
            clearTimeout(timeoutId);
            if (callerSignal) {
                callerSignal.removeEventListener("abort", onCallerAbort);
            }
        }
    }
}
