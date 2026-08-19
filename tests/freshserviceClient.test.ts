// Copyright (c) Microsoft Corporation.  All rights reserved.

import { FreshserviceClient } from "../src/generated/FreshserviceExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/freshservice/abc123";

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

describe("FreshserviceClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new FreshserviceClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(FreshserviceClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new FreshserviceClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new FreshserviceClient(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("FreshserviceClient — createTicketAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST the create-ticket request and return the deserialized response", async () => {
        const response = { id: 101, subject: "Cannot access email", status: 2, priority: 3 };
        mockFetchResponse(response);

        const client = new FreshserviceClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.createTicketAsync({
            subject: "Cannot access email",
            status: "Open",
            priority: "High",
            description: "The user cannot access their email account.",
        });

        expect(result).toEqual(response);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("POST");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(400, "Bad Request");

        const client = new FreshserviceClient(TestConnectionUrl, createMockTokenProvider());
        try {
            await client.createTicketAsync({
                subject: "Cannot access email",
                status: "Open",
                priority: "High",
                description: "The user cannot access their email account.",
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

describe("Freshservice — connector registry", () => {
    it("should expose Freshservice in ConnectorNames", () => {
        expect(ConnectorNames.Freshservice).toBe("freshservice");
    });

    it("should include freshservice in availableConnectors", () => {
        expect(availableConnectors).toContain("freshservice");
    });
});
