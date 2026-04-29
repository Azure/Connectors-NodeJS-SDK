// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Configuration options for connector clients.
 *
 * Mirrors the Python SDK's options.py.
 */

/**
 * Configuration options for connector clients.
 */
export interface ConnectorClientOptions {
    /** The base URI for the connector endpoint. */
    baseUri?: string;

    /** The maximum number of retry attempts. Defaults to 3. */
    maxRetryAttempts?: number;

    /** The timeout for HTTP requests in milliseconds. Defaults to 30000. */
    timeoutMs?: number;

    /** Whether to use exponential backoff for retries. Defaults to true. */
    useExponentialBackoff?: boolean;

    /** The initial retry delay in milliseconds. Defaults to 500. */
    initialRetryDelayMs?: number;
}

/**
 * Default values for connector client options.
 */
export const DefaultConnectorClientOptions: Required<ConnectorClientOptions> = {
    baseUri: "",
    maxRetryAttempts: 3,
    timeoutMs: 30000,
    useExponentialBackoff: true,
    initialRetryDelayMs: 500,
};
