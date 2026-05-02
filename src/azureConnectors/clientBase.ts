// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Abstract base class for generated connector clients.
 *
 * Mirrors the Python SDK's client_base.py.
 */

import { TokenProvider } from "./authentication.ts";
import { ConnectorHttpClient } from "./connectorHttpClient.ts";
import { ConnectorClientOptions } from "./options.ts";

/**
 * Abstract base class for generated connector clients.
 */
export abstract class ConnectorClientBase {
    protected readonly httpClient: ConnectorHttpClient;
    protected readonly options: ConnectorClientOptions;

    /**
     * Initializes a ConnectorClientBase.
     * @param tokenProvider The token provider for authentication.
     * @param options Optional connector client options.
     */
    constructor(tokenProvider: TokenProvider, options?: ConnectorClientOptions) {
        if (!tokenProvider) {
            throw new Error("tokenProvider cannot be null or undefined.");
        }

        this.options = options ?? {};
        this.httpClient = new ConnectorHttpClient(tokenProvider, this.options);
    }

    /**
     * Gets the connector name.
     */
    public abstract get connectorName(): string;
}
