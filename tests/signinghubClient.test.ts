// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { SigninghubClient } from "../src/generated/SigninghubExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/signinghub/abc123";

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

describe("SigninghubClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new SigninghubClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(SigninghubClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new SigninghubClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new SigninghubClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("SigninghubClient — attachmentDownloadAttachmentAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET the attachment and return the deserialized response", async () => {
        const attachment = { fileName: "contract.pdf", contentType: "application/pdf" };
        mockFetchResponse(attachment);

        const client = new SigninghubClient(TestConnectionUrl, createMockCredential());
        const result = await client.attachmentDownloadAttachmentAsync("123", "456", "789");

        expect(result).toEqual(attachment);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, "Not Found");

        const client = new SigninghubClient(TestConnectionUrl, createMockCredential());
        try {
            await client.attachmentDownloadAttachmentAsync("123", "456", "789");
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe("Not Found");
        }
    });
});

describe("SigningHub — connector registry", () => {
    it("should expose SigningHub in ConnectorNames", () => {
        expect(ConnectorNames.SigningHub).toBe("signinghub");
    });

    it("should include signinghub in availableConnectors", () => {
        expect(availableConnectors).toContain("signinghub");
    });
});
