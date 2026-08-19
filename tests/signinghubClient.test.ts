// Copyright (c) Microsoft Corporation.  All rights reserved.

import { SigninghubClient } from "../src/generated/SigninghubExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/signinghub/abc123";

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

describe("SigninghubClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new SigninghubClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(SigninghubClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new SigninghubClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new SigninghubClient(undefined as unknown as string, createMockTokenProvider()))
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

        const client = new SigninghubClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.attachmentDownloadAttachmentAsync("pkg123", "doc123", "att123");

        expect(result).toEqual(attachment);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, "Not Found");

        const client = new SigninghubClient(TestConnectionUrl, createMockTokenProvider());
        try {
            await client.attachmentDownloadAttachmentAsync("pkg123", "doc123", "att123");
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
