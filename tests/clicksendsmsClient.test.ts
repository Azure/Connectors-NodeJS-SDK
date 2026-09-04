// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { ClicksendsmsClient } from "../src/generated/ClicksendsmsExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/clicksendsms/abc123";

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

describe("ClicksendsmsClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new ClicksendsmsClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(ClicksendsmsClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new ClicksendsmsClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new ClicksendsmsClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("ClicksendsmsClient — getContactListsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET the contact lists and return the deserialized response", async () => {
        const contactLists = { data: { total: 1, data: [{ list_id: 1, list_name: "Customers" }] } };
        mockFetchResponse(contactLists);

        const client = new ClicksendsmsClient(TestConnectionUrl, createMockCredential());
        const result = await client.getContactListsAsync();

        expect(result).toEqual(contactLists);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, "Not Found");

        const client = new ClicksendsmsClient(TestConnectionUrl, createMockCredential());
        try {
            await client.getContactListsAsync();
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe("Not Found");
        }
    });
});

describe("ClickSend — connector registry", () => {
    it("should expose ClickSend in ConnectorNames", () => {
        expect(ConnectorNames.ClickSend).toBe("clicksendsms");
    });

    it("should include clicksendsms in availableConnectors", () => {
        expect(availableConnectors).toContain("clicksendsms");
    });
});
