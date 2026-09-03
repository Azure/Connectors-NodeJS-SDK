// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    AzuremonitorlogsClient,
    QueryDataInput,
    Table,
    VisualizeQueryInput,
    VisualizeResults,
} from "../src/generated/AzuremonitorlogsExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/azuremonitorlogs/abc123";

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

// ──────────────────────────────────────────────
// Type-level compile-time checks
// ──────────────────────────────────────────────

const _queryInput: QueryDataInput = {
    query: "Heartbeat | summarize count() by Computer",
    timerangetype: "Last 24 hours",
    timerange: {},
};

const _table: Table = {
    value: [],
};

const _visualizeInput: VisualizeQueryInput = {
    query: "Heartbeat | summarize count() by Computer",
    timerangetype: "Last 24 hours",
    timerange: {},
};

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("AzuremonitorlogsClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new AzuremonitorlogsClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(AzuremonitorlogsClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new AzuremonitorlogsClient(TestConnectionUrl + "///", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should construct with an empty connection URL", () => {
        const client = new AzuremonitorlogsClient("", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should throw on null connection URL", () => {
        expect(() => new AzuremonitorlogsClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new AzuremonitorlogsClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("AzuremonitorlogsClient — queryDataAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /queryDataV2 with correct body and headers", async () => {
        const mockTable: Table = { value: [] };
        mockFetchResponse(mockTable);

        const client = new AzuremonitorlogsClient(TestConnectionUrl, createMockCredential());
        const input: QueryDataInput = {
            query: "Heartbeat | take 10",
            timerangetype: "Last hour",
            timerange: {},
        };

        const result = await client.queryDataAsync(input);

        expect(result).toEqual(mockTable);
        expect(global.fetch).toHaveBeenCalledTimes(1);

        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/queryDataV2");
        expect(init.method).toBe("POST");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(init.headers["Content-Type"]).toBe("application/json");
        expect(JSON.parse(init.body)).toEqual(input);
    });

    it("should include subscription query parameter when provided", async () => {
        mockFetchResponse({});

        const client = new AzuremonitorlogsClient(TestConnectionUrl, createMockCredential());
        await client.queryDataAsync(
            { query: "test", timerangetype: "Last hour", timerange: {} },
            "sub-123",
        );

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("subscriptions=sub-123");
    });
});

describe("AzuremonitorlogsClient — visualizeQueryAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /visualizeQueryV2", async () => {
        const mockResult: VisualizeResults = { body: "chart-data" };
        mockFetchResponse(mockResult);

        const client = new AzuremonitorlogsClient(TestConnectionUrl, createMockCredential());
        const input: VisualizeQueryInput = {
            query: "Heartbeat | summarize count()",
            timerangetype: "Last 24 hours",
            timerange: {},
        };

        const result = await client.visualizeQueryAsync(input);

        expect(result).toEqual(mockResult);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/visualizeQueryV2");
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body)).toEqual(input);
    });

    it("should include visType query parameter when provided", async () => {
        mockFetchResponse({});

        const client = new AzuremonitorlogsClient(TestConnectionUrl, createMockCredential());
        await client.visualizeQueryAsync(
            { query: "test", timerangetype: "Last hour", timerange: {} },
            undefined,
            undefined,
            undefined,
            undefined,
            "piechart",
        );

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("visType=piechart");
    });
});

describe("AzuremonitorlogsClient — error handling", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(400, '{"error": "BadRequest"}');

        const client = new AzuremonitorlogsClient(TestConnectionUrl, createMockCredential());

        await expect(
            client.queryDataAsync({ query: "invalid", timerangetype: "Last hour", timerange: {} }),
        ).rejects.toThrow(ConnectorException);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "Unauthorized"}';
        mockFetchError(401, errorBody);

        const client = new AzuremonitorlogsClient(TestConnectionUrl, createMockCredential());

        try {
            await client.queryDataAsync({ query: "test", timerangetype: "Last hour", timerange: {} });
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(401);
            expect(connectorError.responseBody).toBe(errorBody);
            expect(connectorError.operation).toContain("POST");
        }
    });
});

describe("Azuremonitorlogs — connector registry", () => {
    it("should have azuremonitorlogs in ConnectorNames", () => {
        expect(ConnectorNames.AzureMonitorLogs).toBe("azuremonitorlogs");
    });

    it("should include azuremonitorlogs in availableConnectors", () => {
        expect(availableConnectors).toContain("azuremonitorlogs");
    });
});
