// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Configuration options for connector clients.
 *
 * Mirrors the Python SDK's options.py.
 */

import type { AbortSignalLike } from "@azure/abort-controller";
import type { HttpClient, PipelineOptions, PipelineResponse } from "@azure/core-rest-pipeline";
import type { OperationTracingOptions } from "@azure/core-tracing";

/** Receives the complete HTTP response and parsed operation result before completion. */
export type ConnectorRawResponseCallback = (
    rawResponse: PipelineResponse,
    parsedResponse: unknown,
    error?: unknown,
) => void;

/** Options shared by generated connector operations. */
export interface ConnectorOperationOptions {
    /** Signal used to cancel the operation. */
    abortSignal?: AbortSignalLike;

    /** Callback invoked with the complete response before the operation returns or throws. */
    onResponse?: ConnectorRawResponseCallback;

    /** Context used to parent the operation's tracing span. */
    tracingOptions?: OperationTracingOptions;
}

/**
 * Configuration options for connector clients.
 */
export interface ConnectorClientOptions extends PipelineOptions {
    /**
     * Optional application identifier prepended to the SDK user agent. Maximum 24 characters, with no whitespace.
     * Use userAgentOptions.userAgentPrefix for wrapping SDK identifiers; that prefix is not an application ID.
     */
    applicationId?: string;

    /** The base URI for the connector endpoint. */
    baseUri?: string;

    /** The HTTP transport used by the request pipeline. */
    httpClient?: HttpClient;

    /**
     * Whether SDK and platform identification is added to requests. Explicit values override AZURE_TELEMETRY_DISABLED.
     * Defaults to true unless that environment variable is 'true' (case-insensitive) or '1' at client construction.
     * Does not disable authentication, retries, correlation, tracing, logging, or caller-supplied request headers.
     */
    telemetryEnabled?: boolean;

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
