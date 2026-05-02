// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    KustoClient,
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
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/kusto/abc123";

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
// Type-level compile-time checks
// ──────────────────────────────────────────────

const _queryInput: QueryAndListSchema = {
    csl: {},
    db: {},
    cluster: {},
};

const _commandInput: ControlCommandAndListSchema = {
    csl: ".show tables",
    db: {},
    cluster: {},
};

const _visualizeInput: QueryAndVisualizeSchema = {
    csl: {},
    db: {},
    cluster: {},
    chartType: {},
};

const _commandVisualizeInput: CommandAndVisualizeSchema = {
    csl: ".show tables",
    db: {},
    cluster: {},
    chartType: {},
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
        const client = new KustoClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(KustoClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new KustoClient(TestConnectionUrl + "///", createMockTokenProvider());
        expect(client).toBeDefined();
    });
});

describe("KustoClient — listKustoResultsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /ListKustoResults/false with correct body and headers", async () => {
        const mockTable: Table = { columns: ["col1"], rows: [["val1"]] };
        mockFetchResponse(mockTable);

        const client = new KustoClient(TestConnectionUrl, createMockTokenProvider());
        const input: QueryAndListSchema = {
            csl: {},
            db: {},
            cluster: {},
        };

        const result = await client.listKustoResultsAsync(input);

        expect(result).toEqual(mockTable);
        expect(global.fetch).toHaveBeenCalledTimes(1);

        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/ListKustoResults/false`);
        expect(init.method).toBe("POST");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(init.headers["Content-Type"]).toBe("application/json");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("KustoClient — listKustoShowCommandResultsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /ListKustoShowCommandResults", async () => {
        const mockTable: Table = { columns: ["name"], rows: [["MyTable"]] };
        mockFetchResponse(mockTable);

        const client = new KustoClient(TestConnectionUrl, createMockTokenProvider());
        const input: ControlCommandAndListSchema = {
            csl: ".show tables",
            db: {},
            cluster: {},
        };

        const result = await client.listKustoShowCommandResultsAsync(input);

        expect(result).toEqual(mockTable);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/ListKustoShowCommandResults`);
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("KustoClient — runKustoQueryAndVisualizeResultsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /RunKustoAndVisualizeResults/false", async () => {
        const mockResult: VisualizeResults = { chart: "bar" };
        mockFetchResponse(mockResult);

        const client = new KustoClient(TestConnectionUrl, createMockTokenProvider());
        const input: QueryAndVisualizeSchema = {
            csl: {},
            db: {},
            cluster: {},
            chartType: {},
        };

        const result = await client.runKustoQueryAndVisualizeResultsAsync(input);

        expect(result).toEqual(mockResult);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/RunKustoAndVisualizeResults/false`);
    });
});

describe("KustoClient — runKustoCommandAndVisualizeResultsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /RunKustoAndVisualizeResults/true", async () => {
        const mockResult: VisualizeResults = { chart: "pie" };
        mockFetchResponse(mockResult);

        const client = new KustoClient(TestConnectionUrl, createMockTokenProvider());
        const input: CommandAndVisualizeSchema = {
            csl: ".show tables",
            db: {},
            cluster: {},
            chartType: {},
        };

        const result = await client.runKustoCommandAndVisualizeResultsAsync(input);

        expect(result).toEqual(mockResult);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/RunKustoAndVisualizeResults/true`);
    });
});

describe("KustoClient — runAsyncControlCommandAndWaitAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /RunAsyncControlCommandAndWait", async () => {
        const mockResult: AsyncCommandResult = { state: "Completed" };
        mockFetchResponse(mockResult);

        const client = new KustoClient(TestConnectionUrl, createMockTokenProvider());
        const input: ControlCommandAndListSchema = {
            csl: ".set-or-append async TargetTable <| SourceTable",
            db: {},
            cluster: {},
        };

        const result = await client.runAsyncControlCommandAndWaitAsync(input);

        expect(result).toEqual(mockResult);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/RunAsyncControlCommandAndWait`);
        expect(init.method).toBe("POST");
    });
});

describe("KustoClient — mcpKustoQueryManagementAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /mcp/KustoQueryManagement without session ID", async () => {
        const mockResponse: MCPQueryResponse = { result: "ok" };
        mockFetchResponse(mockResponse);

        const client = new KustoClient(TestConnectionUrl, createMockTokenProvider());
        const input: MCPQueryRequest = {
            jsonrpc: "2.0",
            id: "1",
            method: "tools/call",
        };

        const result = await client.mcpKustoQueryManagementAsync(input);

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/mcp/KustoQueryManagement`);
        expect(url).not.toContain("sessionId");
    });

    it("should include sessionId query parameter when provided", async () => {
        mockFetchResponse({});

        const client = new KustoClient(TestConnectionUrl, createMockTokenProvider());
        const input: MCPQueryRequest = {
            jsonrpc: "2.0",
            id: "2",
            method: "tools/call",
        };

        await client.mcpKustoQueryManagementAsync(input, "session-abc");

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("?sessionId=session-abc");
    });

    it("should URL-encode sessionId when it contains special characters", async () => {
        mockFetchResponse({});

        const client = new KustoClient(TestConnectionUrl, createMockTokenProvider());
        await client.mcpKustoQueryManagementAsync(
            { jsonrpc: "2.0", id: "3", method: "tools/call" },
            "session with spaces",
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

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(401, "Unauthorized");

        const client = new KustoClient(TestConnectionUrl, createMockTokenProvider());
        await expect(
            client.listKustoResultsAsync({ csl: {}, db: {}, cluster: {} }),
        ).rejects.toThrow(ConnectorException);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "Forbidden", "message": "Access denied"}';
        mockFetchError(403, errorBody);

        const client = new KustoClient(TestConnectionUrl, createMockTokenProvider());

        try {
            await client.listKustoResultsAsync({ csl: {}, db: {}, cluster: {} });
            throw new Error("Expected ConnectorException to be thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(403);
            expect(connectorError.responseBody).toBe(errorBody);
            expect(connectorError.operation).toContain("POST");
        }
    });
});

describe("ConnectorException", () => {
    it("should include status code and response body", () => {
        const errorBody = '{"code": "Forbidden"}';
        const error = new ConnectorException("GET /test", 403, errorBody);

        expect(error.statusCode).toBe(403);
        expect(error.responseBody).toBe(errorBody);
        expect(error.operation).toBe("GET /test");
        expect(error.name).toBe("ConnectorException");
    });

    it("should truncate long error response bodies in message", () => {
        const longBody = "x".repeat(3000);
        const error = new ConnectorException("GET /test", 500, longBody);

        expect(error.message).toContain("...[truncated]");
        expect(error.responseBody).toBe(longBody);
        expect(error.responseBody.length).toBe(3000);
    });

    it("should handle empty response body", () => {
        const error = new ConnectorException("POST /query", 500, "");

        expect(error.message).toContain("POST /query");
        expect(error.responseBody).toBe("");
    });
});

describe("Kusto — connector registry", () => {
    it("should have kusto in ConnectorNames", () => {
        expect(ConnectorNames.Kusto).toBe("kusto");
    });

    it("should include kusto in availableConnectors", () => {
        expect(availableConnectors).toContain("kusto");
    });
});
