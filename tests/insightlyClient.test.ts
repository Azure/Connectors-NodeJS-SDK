// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { InsightlyClient } from "../src/generated/InsightlyExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/insightly/abc123";

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
// Runtime tests
// ──────────────────────────────────────────────

describe("InsightlyClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new InsightlyClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(InsightlyClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new InsightlyClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new InsightlyClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("InsightlyClient — listTasksAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET the tasks list and return the deserialized response", async () => {
        const tasks = { value: [{ TASK_ID: 1, TITLE: "Follow up", STATUS: "NOT STARTED" }] };
        mockFetchResponse(tasks);

        const client = new InsightlyClient(TestConnectionUrl, createMockCredential());
        const result = await client.listTasksAsync();

        expect(result).toEqual(tasks);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, "Not Found");

        const client = new InsightlyClient(TestConnectionUrl, createMockCredential());
        try {
            await client.listTasksAsync();
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe("Not Found");
        }
    });
});

describe("Insightly — connector registry", () => {
    it("should expose Insightly in ConnectorNames", () => {
        expect(ConnectorNames.Insightly).toBe("insightly");
    });

    it("should include insightly in availableConnectors", () => {
        expect(availableConnectors).toContain("insightly");
    });
});
