// Copyright (c) Microsoft Corporation.  All rights reserved.

import { ExcelonlineClient } from "../src/generated/ExcelonlineExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/excelonline/abc123";

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

describe("ExcelonlineClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new ExcelonlineClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(ExcelonlineClient);
    });

    it("should strip trailing slashes from connection URL", async () => {
        mockFetchResponse([]);
        const client = new ExcelonlineClient(TestConnectionUrl + "///", createMockTokenProvider());
        await client.getTablesAsync("drive1", "file1");
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        // NOTE: Confirms the trailing slashes were stripped by inspecting the
        //       outbound URL: after the scheme, no `//` should remain.
        expect(String(url).replace(/^https?:\/\//, "")).not.toContain("//");
        jest.restoreAllMocks();
    });

    it("should throw on null connection URL", () => {
        expect(() => new ExcelonlineClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new ExcelonlineClient(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("ExcelonlineClient — getTablesAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET tables for a workbook and return the deserialized response", async () => {
        const tables = { value: [{ id: "table1", name: "Sales" }] };
        mockFetchResponse(tables);

        const client = new ExcelonlineClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getTablesAsync("drive1", "file1");

        expect(result).toEqual(tables);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(url).toContain("/drives/drive1");
        expect(url).toContain("/items/file1");
        expect(url).toContain("/workbook/tables");
    });

    it("should append optional query parameters when provided", async () => {
        mockFetchResponse({ value: [] });

        const client = new ExcelonlineClient(TestConnectionUrl, createMockTokenProvider());
        await client.getTablesAsync("drive1", "file1", undefined, "id");

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("$select=id");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(403, "Forbidden");

        const client = new ExcelonlineClient(TestConnectionUrl, createMockTokenProvider());
        try {
            await client.getTablesAsync("drive1", "file1");
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(403);
            expect(connectorError.responseBody).toBe("Forbidden");
            expect(connectorError.operation).toBe("GET /codeless/v1.0/drives/drive1/items/file1/workbook/tables");
        }
    });
});

describe("Excelonline — connector registry", () => {
    it("should expose ExcelOnlineOneDrive in ConnectorNames", () => {
        expect(ConnectorNames.ExcelOnlineOneDrive).toBe("excelonline");
    });

    it("should include excelonline in availableConnectors", () => {
        expect(availableConnectors).toContain("excelonline");
    });
});
