// Copyright (c) Microsoft Corporation.  All rights reserved.

import { MondayClient } from "../src/generated/MondayExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/monday/abc123";

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

describe("MondayClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new MondayClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(MondayClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new MondayClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new MondayClient(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("MondayClient — createItemAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST the create-item request and return the deserialized response", async () => {
        const response = { data: { create_item: { id: "998877", name: "New item" } } };
        mockFetchResponse(response);

        const client = new MondayClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.createItemAsync({
            workspaceId: "ws123",
            boardId: "board123",
            groupId: "group123",
            itemName: "New item",
        });

        expect(result).toEqual(response);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("POST");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(400, "Bad Request");

        const client = new MondayClient(TestConnectionUrl, createMockTokenProvider());
        try {
            await client.createItemAsync({
                workspaceId: "ws123",
                boardId: "board123",
                groupId: "group123",
                itemName: "New item",
            });
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(400);
            expect(connectorError.responseBody).toBe("Bad Request");
        }
    });
});

describe("Monday — connector registry", () => {
    it("should expose Monday in ConnectorNames", () => {
        expect(ConnectorNames.Monday).toBe("monday");
    });

    it("should include monday in availableConnectors", () => {
        expect(availableConnectors).toContain("monday");
    });
});
