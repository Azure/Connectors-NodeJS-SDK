// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import type { PagedAsyncIterableIterator } from "@azure/core-paging";
import { ConnectorClientBase } from "../src/azureConnectors/clientBase.ts";
import type { ConnectorPageSettings } from "../src/azureConnectors/clientBase.ts";
import type { ConnectorClientOptions } from "../src/azureConnectors/options.ts";

interface TestItem {
    id: string;
}

interface TestPage {
    value?: TestItem[];
    nextLink?: string;
    "@odata.nextLink"?: string;
    records?: TestItem[];
    cursor?: string;
}

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

function createMockCredential(): TokenCredential {
    return {
        getToken: async () => ({ token: "mock-bearer-token", expiresOnTimestamp: Number.MAX_SAFE_INTEGER }),
    };
}

/**
 * Concrete subclass that exposes resolveUrl for testing.
 */
class TestConnectorClient extends ConnectorClientBase {
    public get connectorName(): string {
        return "TestConnector";
    }

    public testResolveUrl(path: string, currentRequestUrl?: string): string {
        return this.resolveUrl(path, currentRequestUrl);
    }

    public testGetOperationPath(url: string): string {
        return this.getOperationPath(url);
    }

    public testCreatePageable(
        firstPageLink: string,
        fetchPage: (url: string, isFirstPage: boolean) => Promise<TestPage | TestItem[]>,
        itemPropertyName?: string | null,
        nextLinkPropertyName?: string,
    ): PagedAsyncIterableIterator<TestItem> {
        return this.createPageable<TestPage | TestItem[], TestItem>(
            firstPageLink,
            fetchPage,
            itemPropertyName,
            nextLinkPropertyName,
        );
    }
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe("ConnectorClientBase", () => {
    describe("constructor", () => {
        it("should strip trailing slashes from connectionRuntimeUrl", () => {
            const client = new TestConnectorClient(
                "https://proxy.azure-apihub.net/apim/arm/conn123///",
                createMockCredential(),
            );

            const result = client.testResolveUrl("/subscriptions");
            expect(result).toBe("https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions");
        });

        it("should preserve connectionRuntimeUrl without trailing slashes", () => {
            const client = new TestConnectorClient(
                "https://proxy.azure-apihub.net/apim/arm/conn123",
                createMockCredential(),
            );

            const result = client.testResolveUrl("/subscriptions");
            expect(result).toBe("https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions");
        });

        it("should throw when credential is null", () => {
            expect(() => new TestConnectorClient("https://example.com", null as unknown as TokenCredential))
            .toThrow("credential cannot be null or undefined.");
        });

        it("should throw when connectionRuntimeUrl is null", () => {
            expect(() => new TestConnectorClient(null as unknown as string, createMockCredential()))
                .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
        });

        it("should throw when connectionRuntimeUrl is undefined", () => {
            expect(() => new TestConnectorClient(undefined as unknown as string, createMockCredential()))
                .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
        });

        it("should accept empty string connectionRuntimeUrl", () => {
            expect(() => new TestConnectorClient("", createMockCredential())).not.toThrow();
        });
    });

    describe("resolveUrl", () => {
        const baseUrl = "https://proxy.azure-apihub.net/apim/arm/conn123";

        it("should resolve relative path by prepending connectionRuntimeUrl", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testResolveUrl("/subscriptions");

            expect(result).toBe("https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions");
        });

        it("should resolve relative path with query string", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testResolveUrl("/subscriptions?page=2&size=10");

            expect(result).toBe("https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions?page=2&size=10");
        });

        it("should resolve query-only continuation against the current page URL", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());
            const currentRequestUrl = `${baseUrl}/subscriptions?page=1`;

            const result = client.testResolveUrl("?page=2", currentRequestUrl);

            expect(result).toBe(`${baseUrl}/subscriptions?page=2`);
        });

        it("should resolve path-relative continuation against the current page URL", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());
            const currentRequestUrl = `${baseUrl}/subscriptions?page=1`;

            const result = client.testResolveUrl("subscriptions?page=2", currentRequestUrl);

            expect(result).toBe(`${baseUrl}/subscriptions?page=2`);
        });

        it("should pass through absolute URL with same host, scheme, and port", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testResolveUrl(
                "https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions?page=2",
            );

            expect(result).toBe("https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions?page=2");
        });

        it("should rewrite foreign host URL through connection runtime URL", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testResolveUrl(
                "https://management.azure.com/subscriptions/sub-id/resourceGroups?$skiptoken=abc",
            );

            expect(result).toBe(
                "https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions/sub-id/resourceGroups?$skiptoken=abc",
            );
        });

        it("should reject same host with different scheme (http vs https)", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            expect(() => client.testResolveUrl(
                "http://proxy.azure-apihub.net/apim/arm/conn123/subscriptions",
            )).toThrow("Refusing to send credentials to a potentially insecure endpoint.");
        });

        it("should reject same host with different port", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            expect(() => client.testResolveUrl(
                "https://proxy.azure-apihub.net:8443/apim/arm/conn123/subscriptions",
            )).toThrow("Refusing to send credentials to a potentially insecure endpoint.");
        });

        it("should throw for absolute URL when connectionRuntimeUrl is empty", () => {
            const client = new TestConnectorClient("", createMockCredential());

            expect(() => client.testResolveUrl(
                "https://management.azure.com/subscriptions",
            )).toThrow("Cannot validate absolute NextLink URL because no connection runtime URL was configured.");
        });

        it("should throw for relative path when connectionRuntimeUrl is empty", () => {
            const client = new TestConnectorClient("", createMockCredential());

            expect(() => client.testResolveUrl("/subscriptions"))
                .toThrow("Cannot resolve relative path because no connection runtime URL was configured.");
        });

        it("should handle foreign host URL with path only (no query string)", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testResolveUrl("https://management.azure.com/subscriptions");

            expect(result).toBe("https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions");
        });

        it("should perform case-insensitive host comparison", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testResolveUrl(
                "https://PROXY.AZURE-APIHUB.NET/apim/arm/conn123/subscriptions?page=2",
            );

            expect(result).toBe("https://PROXY.AZURE-APIHUB.NET/apim/arm/conn123/subscriptions?page=2");
        });
    });

    describe("getOperationPath", () => {
        const baseUrl = "https://proxy.azure-apihub.net/apim/arm/conn123";

        it("should remove the connection runtime URL from an operation", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testGetOperationPath(
                `${baseUrl}/subscriptions?$skiptoken=page-2`,
            );

            expect(result).toBe("/subscriptions?$skiptoken=page-2");
        });

        it("should return the root path when the operation matches the connection URL", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testGetOperationPath(baseUrl);

            expect(result).toBe("/");
        });

        it("should remove a foreign origin without changing the path and query", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testGetOperationPath(
                "https://management.azure.com/subscriptions?$skiptoken=page-2",
            );

            expect(result).toBe("/subscriptions?$skiptoken=page-2");
        });
    });

    describe("createPageable", () => {
        const baseUrl = "https://proxy.azure-apihub.net/apim/arm/conn123";

        it("should expose only continuation tokens as page settings", () => {
            const settings: ConnectorPageSettings = { continuationToken: "?page=2" };

            // @ts-expect-error Connector paging does not support maxPageSize.
            const unsupportedSettings: ConnectorPageSettings = { maxPageSize: 10 };

            expect(settings.continuationToken).toBe("?page=2");
            expect(unsupportedSettings).toEqual({ maxPageSize: 10 });
        });

        it("should lazily yield items and route a foreign nextLink through the connection URL", async () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());
            const requests: Array<{ url: string; isFirstPage: boolean }> = [];
            const pageable = client.testCreatePageable("/items", async (url, isFirstPage) => {
                requests.push({ url, isFirstPage });
                return requests.length === 1
                    ? {
                        value: [{ id: "first" }],
                        nextLink: "https://management.azure.com/items?$skiptoken=second",
                    }
                    : { value: [{ id: "second" }] };
            });

            expect(requests).toEqual([]);

            const items: TestItem[] = [];
            for await (const item of pageable) {
                items.push(item);
            }

            expect(items).toEqual([{ id: "first" }, { id: "second" }]);
            expect(requests).toEqual([
                { url: `${baseUrl}/items`, isFirstPage: true },
                { url: `${baseUrl}/items?$skiptoken=second`, isFirstPage: false },
            ]);
        });

        it("should start byPage from a query-only continuation token and follow an OData next link", async () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());
            const requests: Array<{ url: string; isFirstPage: boolean }> = [];
            const pageable = client.testCreatePageable("/items?page=1", async (url, isFirstPage) => {
                requests.push({ url, isFirstPage });
                return requests.length === 1
                    ? { value: [{ id: "second" }], "@odata.nextLink": "?page=3" }
                    : { value: [{ id: "third" }] };
            });

            const pages: TestItem[][] = [];
            for await (const page of pageable.byPage({ continuationToken: "?page=2" })) {
                pages.push(page);
            }

            expect(pages).toEqual([
                [{ id: "second" }],
                [{ id: "third" }],
            ]);
            expect(requests).toEqual([
                { url: `${baseUrl}/items?page=2`, isFirstPage: false },
                { url: `${baseUrl}/items?page=3`, isFirstPage: false },
            ]);
        });

        it("should identify the initial request for each byPage iterator", async () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());
            const firstPageStates: boolean[] = [];
            const pageable = client.testCreatePageable("/items", async (_url, isFirstPage) => {
                firstPageStates.push(isFirstPage);
                return { value: [{ id: "first" }] };
            });

            await pageable.byPage().next();
            await pageable.byPage().next();

            expect(firstPageStates).toEqual([true, true]);
        });

        it("should resolve a path-relative next link against the current page", async () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());
            const requestedUrls: string[] = [];
            const pageable = client.testCreatePageable("/collections/items?page=1", async (url) => {
                requestedUrls.push(url);
                return requestedUrls.length === 1
                    ? { value: [{ id: "first" }], nextLink: "next?page=2" }
                    : { value: [{ id: "second" }] };
            });

            for await (const page of pageable.byPage()) {
                expect(page).toHaveLength(1);
            }

            expect(requestedUrls).toEqual([
                `${baseUrl}/collections/items?page=1`,
                `${baseUrl}/collections/next?page=2`,
            ]);
        });

        it("should expose a root-array response as one page", async () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());
            const pageable = client.testCreatePageable(
                "/items",
                async () => [{ id: "first" }, { id: "second" }],
                null,
            );

            const pages: TestItem[][] = [];
            for await (const page of pageable.byPage()) {
                pages.push(page);
            }

            expect(pages).toEqual([[{ id: "first" }, { id: "second" }]]);
        });

        it("should read custom item and next-link properties", async () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());
            const requestedUrls: string[] = [];
            const pageable = client.testCreatePageable(
                "/items",
                async (url) => {
                    requestedUrls.push(url);
                    return requestedUrls.length === 1
                        ? { records: [{ id: "first" }], cursor: "?page=2" }
                        : { records: [{ id: "second" }] };
                },
                "records",
                "cursor",
            );

            const items: TestItem[] = [];
            for await (const item of pageable) {
                items.push(item);
            }

            expect(items).toEqual([{ id: "first" }, { id: "second" }]);
            expect(requestedUrls).toEqual([
                `${baseUrl}/items`,
                `${baseUrl}/items?page=2`,
            ]);
        });

        it("should resolve a query-only first page link from the connection root", async () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());
            const requestedUrls: string[] = [];
            const pageable = client.testCreatePageable("?page=1", async (url) => {
                requestedUrls.push(url);
                return { value: [{ id: "first" }] };
            });

            await pageable.next();

            expect(requestedUrls).toEqual([`${baseUrl}/?page=1`]);
        });

        it("should resolve a relative next link against an absolute foreign page link", async () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());
            const requestedUrls: string[] = [];
            const pageable = client.testCreatePageable(
                "https://management.azure.com/collections/items?page=1",
                async (url) => {
                    requestedUrls.push(url);
                    return requestedUrls.length === 1
                        ? { value: [{ id: "first" }], nextLink: "next?page=2" }
                        : { value: [{ id: "second" }] };
                },
            );

            for await (const page of pageable.byPage()) {
                expect(page).toHaveLength(1);
            }

            expect(requestedUrls).toEqual([
                `${baseUrl}/collections/items?page=1`,
                `${baseUrl}/collections/next?page=2`,
            ]);
        });
    });
});
