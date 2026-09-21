// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Abstract base class for generated connector clients.
 *
 * Mirrors the Python SDK's client_base.py.
 */

import type { TokenCredential } from "@azure/core-auth";
import { getPagedAsyncIterator, type PagedAsyncIterableIterator } from "@azure/core-paging";
import { createTracingClient, type TracingClient } from "@azure/core-tracing";
import { ConnectorError } from "./connectorError.ts";
import { ConnectorHttpClient } from "./connectorHttpClient.ts";
import type { ConnectorResponse } from "./connectorHttpClient.ts";
import type { ConnectorClientOptions, ConnectorOperationOptions } from "./options.ts";

interface InitialPageLink {
    readonly url: string;
}

/** Settings supported when iterating connector results by page. */
export interface ConnectorPageSettings {
    /** The token identifying the page from which iteration should resume. */
    continuationToken?: string;
}

/** A connector item iterator whose page API accepts only supported connector settings. */
export type ConnectorPagedAsyncIterableIterator<TItem> =
    PagedAsyncIterableIterator<TItem, TItem[], ConnectorPageSettings>;

/**
 * Abstract base class for generated connector clients.
 */
export abstract class ConnectorClientBase {
    private static readonly PackageName = "@azure/connectors";
    private static readonly PackageVersion = "0.3.0-preview";
    private static readonly TracingNamespace = "Microsoft.Azure.Connectors";

    protected readonly connectionRuntimeUrl: string;
    protected readonly httpClient: ConnectorHttpClient;
    protected readonly options: ConnectorClientOptions;

    private readonly tracingClient: TracingClient;

    /**
     * Initializes a ConnectorClientBase.
     * @param connectionRuntimeUrl The connection runtime URL from Azure Portal.
    * @param credential The credential used for authentication.
     * @param options Optional connector client options.
     */
    constructor(connectionRuntimeUrl: string, credential: TokenCredential, options?: ConnectorClientOptions) {
        if (!connectionRuntimeUrl && connectionRuntimeUrl !== "") {
            throw new Error("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
        }

        if (!credential) {
            throw new Error("credential cannot be null or undefined.");
        }

        let connectionRuntimeUrlEnd = connectionRuntimeUrl.length;
        while (connectionRuntimeUrlEnd > 0 && connectionRuntimeUrl[connectionRuntimeUrlEnd - 1] === "/") {
            connectionRuntimeUrlEnd--;
        }

        this.connectionRuntimeUrl = connectionRuntimeUrl.slice(0, connectionRuntimeUrlEnd);
        this.options = options ?? {};
        this.httpClient = new ConnectorHttpClient(credential, this.options);
        this.tracingClient = createTracingClient({
            namespace: ConnectorClientBase.TracingNamespace,
            packageName: ConnectorClientBase.PackageName,
            packageVersion: ConnectorClientBase.PackageVersion,
        });
    }

    /**
     * Gets the connector name.
     */
    public abstract get connectorName(): string;

    /**
     * Sends one connector request under a public-operation tracing span.
     * @param spanName The public client and method name used for the operation span.
     * @param operationName The stable connector operation identifier used in errors.
     * @param method The HTTP method.
     * @param url The resolved request URL.
     * @param body Optional request body.
     * @param options Operation cancellation and tracing options.
    * @param requestHeaders Service-specific request headers generated from operation options.
     */
    protected async sendWithTracingAsync<TValue>(
        spanName: string,
        operationName: string,
        method: string,
        url: string,
        body: unknown,
        options: ConnectorOperationOptions,
        requestHeaders?: Readonly<Record<string, string>>,
    ): Promise<ConnectorResponse<TValue>> {
        return this.tracingClient.withSpan(spanName, options, async updatedOptions => {
            const response = await this.httpClient.sendAsync<TValue>(
                method,
                url,
                undefined,
                body,
                updatedOptions.abortSignal,
                updatedOptions.tracingOptions,
                requestHeaders,
            );
            if (!response.isSuccessStatusCode) {
                const error = new ConnectorError(this.connectorName, operationName, response.rawResponse);
                options.onResponse?.(response.rawResponse, response.value, error);
                throw error;
            }

            options.onResponse?.(response.rawResponse, response.value);
            return response;
        });
    }

    /**
     * Creates a lazy iterator that resolves and fetches connector response pages on demand.
     * @param firstPageLink The relative or absolute link for the first page.
    * @param fetchPage Fetches one page from an already resolved URL and identifies the initial request.
     * @param itemPropertyName The response property containing page items.
     * @param nextLinkPropertyName The response property containing the next-page URL.
     */
    protected createPageable<TPage extends object, TItem>(
        firstPageLink: string,
        fetchPage: (url: string, isFirstPage: boolean) => Promise<TPage>,
        itemPropertyName: string | null = "value",
        nextLinkPropertyName?: string,
    ): ConnectorPagedAsyncIterableIterator<TItem> {
        const initialPageLink: InitialPageLink = { url: firstPageLink };
        return getPagedAsyncIterator<TItem, TItem[], ConnectorPageSettings, string | InitialPageLink>({
            firstPageLink: initialPageLink,
            getPage: async (pageLink) => {
                const isFirstPage = typeof pageLink !== "string";
                const unresolvedPageLink = isFirstPage ? pageLink.url : pageLink;
                const resolvedPageLink = this.resolvePageLink(unresolvedPageLink, firstPageLink);
                const response = await fetchPage(this.resolveUrl(resolvedPageLink), isFirstPage);
                const page = response as unknown as Record<string, unknown>;
                const items = itemPropertyName === null && Array.isArray(response)
                    ? response
                    : page[itemPropertyName ?? "value"];
                const nextPageLinkValue = nextLinkPropertyName === undefined
                    ? page.nextLink ?? page["@odata.nextLink"]
                    : page[nextLinkPropertyName];
                const nextPageLink = typeof nextPageLinkValue === "string"
                    ? nextPageLinkValue
                    : undefined;
                return {
                    page: Array.isArray(items) ? items as TItem[] : [],
                    nextPageLink: nextPageLink === undefined
                        ? undefined
                        : this.resolvePageLink(nextPageLink, resolvedPageLink),
                };
            },
        });
    }

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

    private resolvePageLink(pageLink: string, basePageLink: string): string {
        try {
            new URL(pageLink);
            return pageLink;
        } catch {
            const placeholderOrigin = "https://connector.invalid";
            let baseUrl: URL;
            try {
                baseUrl = new URL(basePageLink);
            } catch {
                const basePath = basePageLink.startsWith("/") ? basePageLink : `/${basePageLink}`;
                baseUrl = new URL(basePath, placeholderOrigin);
            }

            const resolvedUrl = new URL(pageLink, baseUrl);
            return resolvedUrl.origin === placeholderOrigin
                ? `${resolvedUrl.pathname}${resolvedUrl.search}`
                : resolvedUrl.toString();
        }
    }
}
