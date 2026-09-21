// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Error types for connector operations.
 */

import type { PipelineRequest, PipelineResponse } from "@azure/core-rest-pipeline";

/**
 * Error thrown when connector operations fail.
 */
export class ConnectorError extends Error {
    public static readonly MaxResponseBodyLength = 2000;

    public readonly connectorName: string;
    public readonly operation: string;
    public readonly statusCode: number;
    public readonly responseBody: string;
    public readonly request: PipelineRequest;
    public readonly response: PipelineResponse;

    /**
     * Initializes a ConnectorError.
     * @param connectorName The connector name (e.g., "office365").
     * @param operation The operation that failed (e.g., "GET /v2/Mail").
     * @param response The failed pipeline response and originating request.
     */
    constructor(connectorName: string, operation: string, response: PipelineResponse) {
        const responseBody = response.bodyAsText ?? "";
        const truncated = ConnectorError.truncateBody(responseBody);
        super(`[${connectorName}] ${operation} failed with status ${response.status}: ${truncated}`);
        Object.setPrototypeOf(this, ConnectorError.prototype);
        this.name = "ConnectorError";
        this.connectorName = connectorName;
        this.operation = operation;
        this.statusCode = response.status;
        this.responseBody = responseBody;
        this.request = response.request;
        this.response = response;
    }

    private static truncateBody(body: string): string {
        if (!body || body.length <= ConnectorError.MaxResponseBodyLength) {
            return body;
        }

        return body.substring(0, ConnectorError.MaxResponseBodyLength) + "...[truncated]";
    }
}