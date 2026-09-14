// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Error types for connector operations.
 */

import { RestError } from "@azure/core-rest-pipeline";

/**
 * Error thrown when connector operations fail.
 */
export class ConnectorError extends RestError {
    public static readonly MaxResponseBodyLength = 2000;

    public readonly connectorName: string;
    public readonly operation: string;
    public readonly statusCode: number;
    public readonly responseBody: string;

    /**
     * Initializes a ConnectorError.
     * @param connectorName The connector name (e.g., "office365").
     * @param operation The operation that failed (e.g., "GET /v2/Mail").
     * @param statusCode The HTTP status code.
     * @param responseBody The response body from the failed request.
     */
    constructor(connectorName: string, operation: string, statusCode: number, responseBody: string) {
        const truncated = ConnectorError.truncateBody(responseBody);
        super(
            `[${connectorName}] ${operation} failed with status ${statusCode}: ${truncated}`,
            { statusCode },
        );
        Object.setPrototypeOf(this, ConnectorError.prototype);
        this.name = "ConnectorError";
        this.connectorName = connectorName;
        this.operation = operation;
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    private static truncateBody(body: string): string {
        if (!body || body.length <= ConnectorError.MaxResponseBodyLength) {
            return body;
        }

        return body.substring(0, ConnectorError.MaxResponseBodyLength) + "...[truncated]";
    }
}