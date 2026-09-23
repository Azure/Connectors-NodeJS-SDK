// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { GoogletasksClient } from "../src/generated/GoogletasksExtensions.ts";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/googletasks/abc123";

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

describe("GoogletasksClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new GoogletasksClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(GoogletasksClient);
    });

    it("should strip trailing slashes from connection URL", async () => {
        mockFetchResponse([]);
        const client = new GoogletasksClient(TestConnectionUrl + "///", createMockCredential());
        await client.listTasks("list1").byPage().next();
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        // NOTE: Confirms the trailing slashes were stripped by inspecting the
        //       outbound URL: after the scheme, no `//` should remain.
        expect(String(url).replace(/^https?:\/\//, "")).not.toContain("//");
        jest.restoreAllMocks();
    });

    it("should throw on null connection URL", () => {
        expect(() => new GoogletasksClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new GoogletasksClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("GoogletasksClient — listTasks", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET tasks for a task list and return the deserialized response", async () => {
        const tasks = { items: [{ id: "task1", title: "Write report" }] };
        mockFetchResponse(tasks);

        const client = new GoogletasksClient(TestConnectionUrl, createMockCredential());
        const result = await client.listTasks("list1").byPage().next();

        expect(result.value).toEqual(tasks.items);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(url).toContain("/lists/list1/tasks");
    });

    it("should throw ConnectorError on non-OK response", async () => {
        mockFetchError(404, "Not Found");

        const client = new GoogletasksClient(TestConnectionUrl, createMockCredential());
        try {
            await client.listTasks("missing").byPage().next();
            throw new Error("Expected ConnectorError to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorError);
            const connectorError = error as ConnectorError;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe("Not Found");
            expect(connectorError.operation).toBe("ListTasks");
            expect(connectorError.request.url).toContain("/lists/missing/tasks");
        }
    });
});

describe("GoogletasksClient — createTask", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should expose the corrected operation name and preserve the request", async () => {
        const task = { id: "task1", title: "Write report" };
        mockFetchResponse(task);

        const client = new GoogletasksClient(TestConnectionUrl, createMockCredential());
        const result = await client.createTask({ title: "Write report" }, "list1");

        expect(result).toEqual(task);
        expect("craeteTask" in client).toBe(false);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/lists/list1/tasks");
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body)).toEqual({ title: "Write report" });
    });
});

describe("Googletasks — connector registry", () => {
    it("should expose GoogleTasks in ConnectorNames", () => {
        expect(ConnectorNames.GoogleTasks).toBe("googletasks");
    });

    it("should include googletasks in availableConnectors", () => {
        expect(availableConnectors).toContain("googletasks");
    });
});
