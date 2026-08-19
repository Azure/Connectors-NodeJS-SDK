// Copyright (c) Microsoft Corporation.  All rights reserved.

import { DocuwareClient } from "../src/generated/DocuwareExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/docuware/abc123";

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

describe("DocuwareClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new DocuwareClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(DocuwareClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new DocuwareClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new DocuwareClient(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("DocuwareClient — getOrganizationAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET the organization and return the deserialized response", async () => {
        const organization = { Id: "org1", Name: "Contoso", Guid: "00000000-0000-0000-0000-000000000000" };
        mockFetchResponse(organization);

        const client = new DocuwareClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getOrganizationAsync();

        expect(result).toEqual(organization);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, "Not Found");

        const client = new DocuwareClient(TestConnectionUrl, createMockTokenProvider());
        try {
            await client.getOrganizationAsync();
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe("Not Found");
        }
    });
});

describe("DocuWare — connector registry", () => {
    it("should expose DocuWare in ConnectorNames", () => {
        expect(ConnectorNames.DocuWare).toBe("docuware");
    });

    it("should include docuware in availableConnectors", () => {
        expect(availableConnectors).toContain("docuware");
    });
});
