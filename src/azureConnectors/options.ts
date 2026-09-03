// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Configuration options for connector clients.
 *
 * Mirrors the Python SDK's options.py.
 */

import type { HttpClient, PipelineOptions } from "@azure/core-rest-pipeline";

/**
 * Configuration options for connector clients.
 */
export interface ConnectorClientOptions extends PipelineOptions {
    /** The base URI for the connector endpoint. */
    baseUri?: string;

    /** The HTTP transport used by the request pipeline. */
    httpClient?: HttpClient;
}

/**
 * Default values for connector client options.
 */
export const DefaultConnectorClientOptions: Required<Pick<ConnectorClientOptions, "baseUri">> = {
    baseUri: "",
};
