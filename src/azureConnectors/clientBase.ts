// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Abstract base class for generated connector clients.
 *
 * Mirrors the Python SDK's client_base.py.
 */

import type { TokenCredential } from "@azure/core-auth";
import { TokenProvider } from "./authentication.ts";
import { ConnectorHttpClient } from "./connectorHttpClient.ts";
import { ConnectorClientOptions } from "./options.ts";

/**
 * Abstract base class for generated connector clients.
 */
export abstract class ConnectorClientBase {
    protected readonly connectionRuntimeUrl: string;
    protected readonly httpClient: ConnectorHttpClient;
    protected readonly options: ConnectorClientOptions;

    /**
     * Initializes a ConnectorClientBase.
     * @param connectionRuntimeUrl The connection runtime URL from Azure Portal.
     * @param credential The Azure credential or legacy token provider for authentication.
     * @param options Optional connector client options.
     */
    constructor(
        connectionRuntimeUrl: string,
        credential: TokenCredential | TokenProvider,
        options?: ConnectorClientOptions,
    ) {
        if (!connectionRuntimeUrl && connectionRuntimeUrl !== "") {
            throw new Error("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
        }

        if (!credential) {
            throw new Error("credential cannot be null or undefined.");
        }

        let connectionRuntimeUrlEnd = connectionRuntimeUrl.length;
        while (connectionRuntimeUrlEnd > 0 && connectionRuntimeUrl.charCodeAt(connectionRuntimeUrlEnd - 1) === 47) {
            connectionRuntimeUrlEnd--;
        }

        this.connectionRuntimeUrl = connectionRuntimeUrl.slice(0, connectionRuntimeUrlEnd);
        this.options = options ?? {};
        this.httpClient = new ConnectorHttpClient(credential, this.options);
    }

    /**
     * Gets the connector name.
     */
    public abstract get connectorName(): string;

    /**
     * Resolves a relative path or validates an absolute URL against the connection runtime URL.
     * When the URL host matches the connection URL, it is used as-is.
     * When it does not match (codeless connectors like ARM return nextLink pointing to the backend
     * host e.g. management.azure.com), the path+query is extracted and routed through the APIM proxy.
    * @param path The relative path or absolute URL to resolve.
    * @param currentRequestUrl The current page URL for resolving relative continuations.
     */
    protected resolveUrl(path: string, currentRequestUrl?: string): string {
        let parsedUrl: URL | undefined;

        try {
            parsedUrl = new URL(path);
        } catch {
            // NOTE(daviburg): Not an absolute URL — treat as relative path.
            parsedUrl = undefined;
        }

        if (parsedUrl !== undefined) {
            if (!this.connectionRuntimeUrl) {
                throw new Error(
                    "Cannot validate absolute NextLink URL because no connection runtime URL was configured.",
                );
            }

            const baseUrl = new URL(this.connectionRuntimeUrl);

            if (parsedUrl.hostname.toLowerCase() === baseUrl.hostname.toLowerCase()) {
                if (parsedUrl.protocol.toLowerCase() === baseUrl.protocol.toLowerCase() &&
                    parsedUrl.port === baseUrl.port) {
                    return path;
                }

                // NOTE(daviburg): Same host but different scheme or port — reject to prevent
                // sending credentials over an insecure channel (e.g., http instead of https).
                throw new Error(
                    `NextLink URI '${parsedUrl.protocol}//${parsedUrl.hostname}:${parsedUrl.port}' has the same host ` +
                    `as the connection but uses a different scheme or port than ` +
                    `'${baseUrl.protocol}//${baseUrl.hostname}:${baseUrl.port}'. ` +
                    "Refusing to send credentials to a potentially insecure endpoint.",
                );
            }

            // NOTE(daviburg): NextLink from a different host (e.g., codeless connector backend).
            // Extract path+query and route through the connection runtime URL.
            return `${this.connectionRuntimeUrl}${parsedUrl.pathname}${parsedUrl.search}`;
        }

        if (!this.connectionRuntimeUrl) {
            throw new Error(
                "Cannot resolve relative path because no connection runtime URL was configured.",
            );
        }

        if (currentRequestUrl !== undefined && !path.startsWith("/")) {
            return new URL(path, currentRequestUrl).toString();
        }

        return `${this.connectionRuntimeUrl}${path}`;
    }

    /**
     * Gets the operation path for a resolved connector request URL.
     * @param url The resolved request URL.
     */
    protected getOperationPath(url: string): string {
        const operationUrl = new URL(url);
        const baseUrl = new URL(this.connectionRuntimeUrl);
        const basePath = baseUrl.pathname.replace(/\/+$/, "");

        if (operationUrl.origin.toLowerCase() === baseUrl.origin.toLowerCase() &&
            (operationUrl.pathname === basePath || operationUrl.pathname.startsWith(`${basePath}/`))) {
            const relativePath = operationUrl.pathname.substring(basePath.length) || "/";
            return `${relativePath}${operationUrl.search}`;
        }

        return `${operationUrl.pathname}${operationUrl.search}`;
    }
}
