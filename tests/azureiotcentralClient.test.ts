// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { AzureiotcentralClient } from "../src/generated/AzureiotcentralExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/azureiotcentral/abc123";

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

describe("AzureiotcentralClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new AzureiotcentralClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(AzureiotcentralClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new AzureiotcentralClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new AzureiotcentralClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("AzureiotcentralClient — deviceGroupsListAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET the device groups list and return the deserialized response", async () => {
        const deviceGroups = { value: [{ id: "dg1", displayName: "Device Group 1" }] };
        mockFetchResponse(deviceGroups);

        const client = new AzureiotcentralClient(TestConnectionUrl, createMockCredential());
        const result = await client.deviceGroupsListAsync();

        expect(result).toEqual(deviceGroups);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, "Not Found");

        const client = new AzureiotcentralClient(TestConnectionUrl, createMockCredential());
        try {
            await client.deviceGroupsListAsync();
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe("Not Found");
        }
    });
});

describe("AzureIoTCentralV3 — connector registry", () => {
    it("should expose AzureIoTCentralV3 in ConnectorNames", () => {
        expect(ConnectorNames.AzureIoTCentralV3).toBe("azureiotcentral");
    });

    it("should include azureiotcentral in availableConnectors", () => {
        expect(availableConnectors).toContain("azureiotcentral");
    });
});
