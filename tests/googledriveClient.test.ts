// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { GoogledriveClient } from "../src/generated/GoogledriveExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/googledrive/abc123";

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

describe("GoogledriveClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new GoogledriveClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(GoogledriveClient);
    });

    it("should strip trailing slashes from connection URL", async () => {
        mockFetchResponse({});
        const client = new GoogledriveClient(TestConnectionUrl + "///", createMockCredential());
        await client.getFileMetadataAsync("file1");
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        // NOTE: Confirms the trailing slashes were stripped by inspecting the
        //       outbound URL: after the scheme, no `//` should remain.
        expect(String(url).replace(/^https?:\/\//, "")).not.toContain("//");
        jest.restoreAllMocks();
    });

    it("should throw on null connection URL", () => {
        expect(() => new GoogledriveClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new GoogledriveClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("GoogledriveClient — getFileMetadataAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET file metadata by id and return the deserialized response", async () => {
        const metadata = { Id: "file1", Name: "notes.txt", DisplayName: "notes.txt" };
        mockFetchResponse(metadata);

        const client = new GoogledriveClient(TestConnectionUrl, createMockCredential());
        const result = await client.getFileMetadataAsync("file1");

        expect(result).toEqual(metadata);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(url).toContain("file1");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, "Not Found");

        const client = new GoogledriveClient(TestConnectionUrl, createMockCredential());
        try {
            await client.getFileMetadataAsync("missing");
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe("Not Found");
            expect(connectorError.operation).toBe("GET /datasets/default/files/missing");
        }
    });
});

describe("Googledrive — connector registry", () => {
    it("should expose GoogleDrive in ConnectorNames", () => {
        expect(ConnectorNames.GoogleDrive).toBe("googledrive");
    });

    it("should include googledrive in availableConnectors", () => {
        expect(availableConnectors).toContain("googledrive");
    });
});
