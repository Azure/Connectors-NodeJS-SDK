// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    KustoClient,
    Query,
    DatabaseName,
    ClusterName,
    ChartType,
    QueryAndListSchema,
    ControlCommandAndListSchema,
    QueryAndVisualizeSchema,
    CommandAndVisualizeSchema,
    Table,
    VisualizeResults,
    AsyncCommandResult,
    MCPQueryRequest,
    MCPQueryResponse,
} from "../src/generated/KustoExtensions.ts";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/kusto/abc123";

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

const _queryInput: QueryAndListSchema = {
    csl: "TestTable | take 10" as unknown as Query,
    db: "testdb" as unknown as DatabaseName,
    cluster: "testcluster" as unknown as ClusterName,
};

const _commandInput: ControlCommandAndListSchema = {
    csl: ".show tables",
    db: "testdb" as unknown as DatabaseName,
    cluster: "testcluster" as unknown as ClusterName,
};

const _visualizeInput: QueryAndVisualizeSchema = {
    csl: "TestTable | take 10" as unknown as Query,
    db: "testdb" as unknown as DatabaseName,
    cluster: "testcluster" as unknown as ClusterName,
    chartType: "Bar Chart" as unknown as ChartType,
};

const _commandVisualizeInput: CommandAndVisualizeSchema = {
    csl: ".show tables",
    db: "testdb" as unknown as DatabaseName,
    cluster: "testcluster" as unknown as ClusterName,
    chartType: "Bar Chart" as unknown as ChartType,
};

const _mcpRequest: MCPQueryRequest = {
    jsonrpc: "2.0",
    id: "1",
    method: "tools/call",
};

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("KustoClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new KustoClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(KustoClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new KustoClient(TestConnectionUrl + "///", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should throw on null connection URL", () => {
        expect(() => new KustoClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new KustoClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("KustoClient — listKustoResults", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /ListKustoResults/false with correct body and headers", async () => {
        const mockTable: Table = { value: [{ value: ["val1"] }] };
        mockFetchResponse(mockTable);

        const client = new KustoClient(TestConnectionUrl, createMockCredential());
        const input: QueryAndListSchema = {
            csl: "TestTable | take 10" as unknown as Query,
            db: "testdb" as unknown as DatabaseName,
            cluster: "testcluster" as unknown as ClusterName,
        };

        const result = await client.listKustoResults(input).byPage().next();

        expect(result.value).toEqual(mockTable.value);
        expect(global.fetch).toHaveBeenCalledTimes(1);

        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/ListKustoResults/false`);
        expect(init.method).toBe("POST");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(init.headers["Content-Type"]).toBe("application/json");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("KustoClient — listKustoShowCommandResults", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /ListKustoShowCommandResults", async () => {
        const mockTable: Table = { value: [{ value: ["MyTable"] }] };
        mockFetchResponse(mockTable);

        const client = new KustoClient(TestConnectionUrl, createMockCredential());
        const input: ControlCommandAndListSchema = {
            csl: ".show tables",
            db: "testdb" as unknown as DatabaseName,
            cluster: "testcluster" as unknown as ClusterName,
        };

        const result = await client.listKustoShowCommandResults(input).byPage().next();

        expect(result.value).toEqual(mockTable.value);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/ListKustoShowCommandResults`);
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("KustoClient — runKustoQueryAndVisualizeResults", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /RunKustoAndVisualizeResults/false", async () => {
        const mockResult: VisualizeResults = { body: "bar-chart-data" };
        mockFetchResponse(mockResult);

        const client = new KustoClient(TestConnectionUrl, createMockCredential());
        const input: QueryAndVisualizeSchema = {
            csl: "TestTable | take 10" as unknown as Query,
            db: "testdb" as unknown as DatabaseName,
            cluster: "testcluster" as unknown as ClusterName,
            chartType: "Bar Chart" as unknown as ChartType,
        };

        const result = await client.runKustoQueryAndVisualizeResults(input);

        expect(result).toEqual(mockResult);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/RunKustoAndVisualizeResults/false`);
    });
});

describe("KustoClient — runKustoCommandAndVisualizeResults", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /RunKustoAndVisualizeResults/true", async () => {
        const mockResult: VisualizeResults = { body: "pie-chart-data" };
        mockFetchResponse(mockResult);

        const client = new KustoClient(TestConnectionUrl, createMockCredential());
        const input: CommandAndVisualizeSchema = {
            csl: ".show tables",
            db: "testdb" as unknown as DatabaseName,
            cluster: "testcluster" as unknown as ClusterName,
            chartType: "Bar Chart" as unknown as ChartType,
        };

        const result = await client.runKustoCommandAndVisualizeResults(input);

        expect(result).toEqual(mockResult);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/RunKustoAndVisualizeResults/true`);
    });
});

describe("KustoClient — runAsyncControlCommandAndWait", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /RunAsyncControlCommandAndWait", async () => {
        const mockResult: AsyncCommandResult = { state: "Completed" };
        mockFetchResponse(mockResult);

        const client = new KustoClient(TestConnectionUrl, createMockCredential());
        const input: ControlCommandAndListSchema = {
            csl: ".set-or-append async TargetTable <| SourceTable",
            db: "testdb" as unknown as DatabaseName,
            cluster: "testcluster" as unknown as ClusterName,
        };

        const result = await client.runAsyncControlCommandAndWait(input);

        expect(result).toEqual(mockResult);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/RunAsyncControlCommandAndWait`);
        expect(init.method).toBe("POST");
    });
});

describe("KustoClient — mcpKustoQueryManagement", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /mcp/KustoQueryManagement without session ID", async () => {
        const mockResponse: MCPQueryResponse = { result: { status: "ok" } };
        mockFetchResponse(mockResponse);

        const client = new KustoClient(TestConnectionUrl, createMockCredential());
        const input: MCPQueryRequest = {
            jsonrpc: "2.0",
            id: "1",
            method: "tools/call",
        };

        const result = await client.mcpKustoQueryManagement(input);

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/mcp/KustoQueryManagement`);
        expect(url).not.toContain("sessionId");
    });

    it("should include sessionId query parameter when provided", async () => {
        mockFetchResponse({});

        const client = new KustoClient(TestConnectionUrl, createMockCredential());
        const input: MCPQueryRequest = {
            jsonrpc: "2.0",
            id: "2",
            method: "tools/call",
        };

        await client.mcpKustoQueryManagement(input, { sessionId: "session-abc" });

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("?sessionId=session-abc");
    });

    it("should URL-encode sessionId when it contains special characters", async () => {
        mockFetchResponse({});

        const client = new KustoClient(TestConnectionUrl, createMockCredential());
        await client.mcpKustoQueryManagement(
            { jsonrpc: "2.0", id: "3", method: "tools/call" },
            { sessionId: "session with spaces" },
        );

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain(encodeURIComponent("session with spaces"));
        expect(url).not.toContain("session with spaces");
    });
});

describe("KustoClient — error handling", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw ConnectorError on non-OK response", async () => {
        mockFetchError(401, "Unauthorized");

        const client = new KustoClient(TestConnectionUrl, createMockCredential());
        await expect(
            client.listKustoResults({ csl: "test" as unknown as Query, db: "testdb" as unknown as DatabaseName, cluster: "testcluster" as unknown as ClusterName }).byPage().next(),
        ).rejects.toThrow(ConnectorError);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "Forbidden", "message": "Access denied"}';
        mockFetchError(403, errorBody);

        const client = new KustoClient(TestConnectionUrl, createMockCredential());

        try {
            await client.listKustoResults({ csl: "test" as unknown as Query, db: "testdb" as unknown as DatabaseName, cluster: "testcluster" as unknown as ClusterName }).byPage().next();
            throw new Error("Expected ConnectorError to be thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorError);
            const connectorError = error as ConnectorError;
            expect(connectorError.statusCode).toBe(403);
            expect(connectorError.responseBody).toBe(errorBody);
            expect(connectorError.operation).toBe("listKustoResultsPost");
        }
    });
});

describe("Kusto — connector registry", () => {
    it("should have kusto in ConnectorNames", () => {
        expect(ConnectorNames.AzureDataExplorer).toBe("kusto");
    });

    it("should include kusto in availableConnectors", () => {
        expect(availableConnectors).toContain("kusto");
    });
});
