// Copyright (c) Microsoft Corporation.  All rights reserved.

import { GoogletasksClient } from "../src/generated/GoogletasksExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/googletasks/abc123";

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

describe("GoogletasksClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new GoogletasksClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(GoogletasksClient);
    });

    it("should strip trailing slashes from connection URL", async () => {
        mockFetchResponse([]);
        const client = new GoogletasksClient(TestConnectionUrl + "///", createMockTokenProvider());
        await client.listTasksAsync("list1");
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        // NOTE: Confirms the trailing slashes were stripped by inspecting the
        //       outbound URL: after the scheme, no `//` should remain.
        expect(String(url).replace(/^https?:\/\//, "")).not.toContain("//");
        jest.restoreAllMocks();
    });

    it("should throw on null connection URL", () => {
        expect(() => new GoogletasksClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new GoogletasksClient(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("GoogletasksClient — listTasksAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET tasks for a task list and return the deserialized response", async () => {
        const tasks = { value: [{ id: "task1", title: "Write report" }] };
        mockFetchResponse(tasks);

        const client = new GoogletasksClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.listTasksAsync("list1");

        expect(result).toEqual(tasks);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(url).toContain("/lists/list1/tasks");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, "Not Found");

        const client = new GoogletasksClient(TestConnectionUrl, createMockTokenProvider());
        await expect(client.listTasksAsync("missing")).rejects.toThrow(ConnectorException);
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
