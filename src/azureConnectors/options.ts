// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Configuration options for connector clients.
 *
 * Mirrors the Python SDK's options.py.
 */

import type { AbortSignalLike } from "@azure/abort-controller";
import type { HttpClient, PipelineOptions } from "@azure/core-rest-pipeline";
import type { OperationTracingOptions } from "@azure/core-tracing";

/** Options shared by generated connector operations. */
export interface ConnectorOperationOptions {
    /** Signal used to cancel the operation. */
    abortSignal?: AbortSignalLike;

    /** Context used to parent the operation's tracing span. */
    tracingOptions?: OperationTracingOptions;
}

/**
 * Configuration options for connector clients.
 */
export interface ConnectorClientOptions extends PipelineOptions {
    /** The base URI for the connector endpoint. */
    baseUri?: string;

    /** The HTTP transport used by the request pipeline. */
    httpClient?: HttpClient;

    /**
     * Whether retries are allowed for unsafe HTTP methods such as POST, PUT, PATCH, and DELETE.
     * Defaults to false because retrying a completed connector action can duplicate side effects.
     */
    retryUnsafeHttpMethods?: boolean;
}

/**
 * Default values for connector client options.
 */
export const DefaultConnectorClientOptions: Required<Pick<ConnectorClientOptions, "baseUri">> = {
    baseUri: "",
};
