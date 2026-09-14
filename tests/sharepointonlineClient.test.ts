// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    SharepointonlineClient,
    TablesList,
    PostItemInput,
} from "../src/generated/SharepointonlineExtensions.ts";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// Test helpers

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/sharepointonline/abc123";

function createMockCredential(): TokenCredential {
    return {
        getToken: async () => ({ token: "mock-bearer-token", expiresOnTimestamp: Number.MAX_SAFE_INTEGER }),
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

// Runtime tests

describe("SharepointonlineClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new SharepointonlineClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(SharepointonlineClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new SharepointonlineClient(TestConnectionUrl + "///", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should throw on null connection URL", () => {
        expect(() => new SharepointonlineClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new SharepointonlineClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("SharepointonlineClient — getTables", () => {
    afterEach(() => { jest.restoreAllMocks(); });

    it("should GET tables with encoded dataset", async () => {
        const mockTables: TablesList = {};
        mockFetchResponse(mockTables);

        const client = new SharepointonlineClient(TestConnectionUrl, createMockCredential());
        const result = await client.getTables("https://contoso.sharepoint.com/sites/team");

        expect(result).toEqual(mockTables);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain(encodeURIComponent(encodeURIComponent("https://contoso.sharepoint.com/sites/team")));
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });
});

describe("SharepointonlineClient — getAllTables", () => {
    afterEach(() => { jest.restoreAllMocks(); });

    it("should encode site address in URL", async () => {
        const mockTables: TablesList = {};
        mockFetchResponse(mockTables);

        const client = new SharepointonlineClient(TestConnectionUrl, createMockCredential());
        const result = await client.getAllTables("https://contoso.sharepoint.com/sites/team");

        expect(result).toEqual(mockTables);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/datasets/");
        expect(url).toContain(encodeURIComponent(encodeURIComponent("https://contoso.sharepoint.com/sites/team")));
        expect(url).toContain("/alltables");
    });
});

describe("SharepointonlineClient — getItem", () => {
    afterEach(() => { jest.restoreAllMocks(); });

    it("should GET a specific item by ID", async () => {
        const mockItem = { Id: 42, Title: "Important Document" };
        mockFetchResponse(mockItem);

        const client = new SharepointonlineClient(TestConnectionUrl, createMockCredential());
        const result = await client.getItem("https://contoso.sharepoint.com", "Documents", "42");

        expect(result).toEqual(mockItem);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/items/42");
        expect(init.method).toBe("GET");
    });
});

describe("SharepointonlineClient — postItem", () => {
    afterEach(() => { jest.restoreAllMocks(); });

    it("should POST new item with body", async () => {
        const newItem = { Id: 99, Title: "New Item" };
        mockFetchResponse(newItem);

        const client = new SharepointonlineClient(TestConnectionUrl, createMockCredential());
        const input: PostItemInput = { Title: "New Item" };
        const result = await client.postItem(input, "https://contoso.sharepoint.com", "Tasks");

        expect(result).toEqual(newItem);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("POST");
        expect(init.headers["Content-Type"]).toBe("application/json");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("SharepointonlineClient — deleteItem", () => {
    afterEach(() => { jest.restoreAllMocks(); });

    it("should send DELETE request", async () => {
        mockFetchResponse(null);

        const client = new SharepointonlineClient(TestConnectionUrl, createMockCredential());
        await client.deleteItem("https://contoso.sharepoint.com", "Tasks", "42");

        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("DELETE");
    });
});

describe("SharepointonlineClient — error handling", () => {
    afterEach(() => { jest.restoreAllMocks(); });

    it("should throw ConnectorError on non-OK response", async () => {
        mockFetchError(404, '{"error": "List not found"}');

        const client = new SharepointonlineClient(TestConnectionUrl, createMockCredential());
        await expect(client.getTables("https://contoso.sharepoint.com")).rejects.toThrow(ConnectorError);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "Forbidden"}';
        mockFetchError(403, errorBody);

        const client = new SharepointonlineClient(TestConnectionUrl, createMockCredential());

        try {
            await client.getTables("https://contoso.sharepoint.com");
            throw new Error("Expected ConnectorError to be thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorError);
            const connectorError = error as ConnectorError;
            expect(connectorError.statusCode).toBe(403);
            expect(connectorError.responseBody).toBe(errorBody);
            expect(connectorError.operation).toContain("GET");
        }
    });

    it("should truncate long error response bodies in message", () => {
        const longBody = "x".repeat(3000);
        const error = new ConnectorError("sharepointonline", "GET /test", 500, longBody);

        expect(error.message).toContain("...[truncated]");
        expect(error.responseBody).toBe(longBody);
    });
});

describe("SharepointOnline — connector registry", () => {
    it("should have sharepointonline in ConnectorNames", () => {
        expect(ConnectorNames.SharePoint).toBe("sharepointonline");
    });

    it("should include sharepointonline in availableConnectors", () => {
        expect(availableConnectors).toContain("sharepointonline");
    });
});
