// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { InfusionsoftClient } from "../src/generated/InfusionsoftExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/infusionsoft/abc123";

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

describe("InfusionsoftClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new InfusionsoftClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(InfusionsoftClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new InfusionsoftClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new InfusionsoftClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("InfusionsoftClient — createTaskAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST the create-task request and return the deserialized response", async () => {
        const response = { id: 55, title: "Follow up with lead", completed: false };
        mockFetchResponse(response);

        const client = new InfusionsoftClient(TestConnectionUrl, createMockCredential());
        const result = await client.createTaskAsync({ title: "Follow up with lead" });

        expect(result).toEqual(response);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("POST");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(400, "Bad Request");

        const client = new InfusionsoftClient(TestConnectionUrl, createMockCredential());
        try {
            await client.createTaskAsync({ title: "Follow up with lead" });
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(400);
            expect(connectorError.responseBody).toBe("Bad Request");
        }
    });
});

describe("Infusionsoft — connector registry", () => {
    it("should expose Infusionsoft in ConnectorNames", () => {
        expect(ConnectorNames.Infusionsoft).toBe("infusionsoft");
    });

    it("should include infusionsoft in availableConnectors", () => {
        expect(availableConnectors).toContain("infusionsoft");
    });
});
