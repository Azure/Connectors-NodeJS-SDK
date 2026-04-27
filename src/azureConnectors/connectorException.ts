// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Exception types for connector operations.
 *
 * Mirrors the Python SDK's exceptions.py.
 */

/**
 * Exception thrown when connector operations fail.
 */
export class ConnectorException extends Error {
    public static readonly MaxResponseBodyLength = 2000;

    public readonly operation: string;
    public readonly statusCode: number;
    public readonly responseBody: string;

    /**
     * Initializes a ConnectorException.
     * @param operation The operation that failed (e.g., "GET /v2/Mail").
     * @param statusCode The HTTP status code.
     * @param responseBody The response body from the failed request.
     */
    constructor(operation: string, statusCode: number, responseBody: string) {
        const truncated = ConnectorException.truncateBody(responseBody);
        super(`${operation} failed with status ${statusCode}: ${truncated}`);
        this.name = "ConnectorException";
        this.operation = operation;
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    private static truncateBody(body: string): string {
        if (!body || body.length <= ConnectorException.MaxResponseBodyLength) {
            return body;
        }

        return body.substring(0, ConnectorException.MaxResponseBodyLength) + "...[truncated]";
    }
}
