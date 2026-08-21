// Copyright (c) Microsoft Corporation.  All rights reserved.

import { ProjectplaceClient } from "../src/generated/ProjectplaceExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/projectplace/abc123";

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

describe("ProjectplaceClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new ProjectplaceClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(ProjectplaceClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new ProjectplaceClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new ProjectplaceClient(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("ProjectplaceClient — createCardAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST the create-card request and return the deserialized response", async () => {
        const response = { id: 4242, title: "Design review", board_id: 123, is_done: false };
        mockFetchResponse(response);

        const client = new ProjectplaceClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.createCardAsync({ title: "Design review" }, "123");

        expect(result).toEqual(response);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("POST");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(400, "Bad Request");

        const client = new ProjectplaceClient(TestConnectionUrl, createMockTokenProvider());
        try {
            await client.createCardAsync({ title: "Design review" }, "123");
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(400);
            expect(connectorError.responseBody).toBe("Bad Request");
        }
    });
});

describe("ProjectPlace — connector registry", () => {
    it("should expose ProjectPlace in ConnectorNames", () => {
        expect(ConnectorNames.ProjectPlace).toBe("projectplace");
    });

    it("should include projectplace in availableConnectors", () => {
        expect(availableConnectors).toContain("projectplace");
    });
});
