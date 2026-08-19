// Copyright (c) Microsoft Corporation.  All rights reserved.

import { PipedriveClient } from "../src/generated/PipedriveExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/pipedrive/abc123";

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

describe("PipedriveClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new PipedriveClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(PipedriveClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new PipedriveClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new PipedriveClient(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("PipedriveClient — getDealAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET the deal and return the deserialized response", async () => {
        const deal = { data: { id: 123, title: "New opportunity", value: 5000, currency: "USD" } };
        mockFetchResponse(deal);

        const client = new PipedriveClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getDealAsync("deal123");

        expect(result).toEqual(deal);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, "Not Found");

        const client = new PipedriveClient(TestConnectionUrl, createMockTokenProvider());
        try {
            await client.getDealAsync("deal123");
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe("Not Found");
        }
    });
});

describe("Pipedrive — connector registry", () => {
    it("should expose Pipedrive in ConnectorNames", () => {
        expect(ConnectorNames.Pipedrive).toBe("pipedrive");
    });

    it("should include pipedrive in availableConnectors", () => {
        expect(availableConnectors).toContain("pipedrive");
    });
});
