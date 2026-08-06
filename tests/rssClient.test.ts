// Copyright (c) Microsoft Corporation.  All rights reserved.

import { RssClient } from "../src/generated/RssExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/rss/abc123";

function createMockTokenProvider(): TokenProvider {
    return {
        getAccessTokenAsync: async () => "mock-bearer-token",
    };
}

function mockFetchResponse(body: unknown, status = 200): void {
    global.fetch = jest.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        text: async () => (body !== undefined && body !== null ? JSON.stringify(body) : ""),
        headers: new Headers(),
    } as Response);
}

function mockFetchError(status: number, errorBody: string): void {
    global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status,
        text: async () => errorBody,
        headers: new Headers(),
    } as Response);
}

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("RssClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new RssClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(RssClient);
    });

    it("should strip trailing slashes from connection URL", async () => {
        mockFetchResponse([]);
        const client = new RssClient(TestConnectionUrl + "///", createMockTokenProvider());
        await client.listFeedItemsAsync("https://example.com/feed.xml");
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        // NOTE: Confirms the trailing slashes were stripped by inspecting the
        //       outbound URL: after the scheme, no `//` should remain.
        expect(String(url).replace(/^https?:\/\//, "")).not.toContain("//");
        jest.restoreAllMocks();
    });

    it("should throw on null connection URL", () => {
        expect(() => new RssClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new RssClient(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("RssClient — listFeedItemsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET feed items and return the deserialized array", async () => {
        const feedItems = [
            { id: "item1", title: "Breaking News" },
            { id: "item2", title: "Follow-up" },
        ];
        mockFetchResponse(feedItems);

        const client = new RssClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.listFeedItemsAsync("https://example.com/feed.xml");

        expect(result).toEqual(feedItems);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(url).toContain("?");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(400, "Bad Request");

        const client = new RssClient(TestConnectionUrl, createMockTokenProvider());
        await expect(client.listFeedItemsAsync("https://example.com/feed.xml")).rejects.toThrow(ConnectorException);
    });
});

describe("Rss — connector registry", () => {
    it("should expose RSS in ConnectorNames", () => {
        expect(ConnectorNames.RSS).toBe("rss");
    });

    it("should include rss in availableConnectors", () => {
        expect(availableConnectors).toContain("rss");
    });
});
