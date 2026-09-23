// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { CloudmersiveconvertClient } from "../src/generated/CloudmersiveconvertExtensions.ts";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/cloudmersiveconvert/abc123";

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

describe("CloudmersiveconvertClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new CloudmersiveconvertClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(CloudmersiveconvertClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new CloudmersiveconvertClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new CloudmersiveconvertClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("CloudmersiveconvertClient — createEditDocumentDocxBlankDocument", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST the create-blank-document request and return the deserialized response", async () => {
        const response = { EditedDocumentURL: "https://cloudmersive.com/output/blank.docx", Successful: true };
        mockFetchResponse(response);

        const client = new CloudmersiveconvertClient(TestConnectionUrl, createMockCredential());
        const result = await client.createEditDocumentDocxBlankDocument({ InitialText: "Hello world" });

        expect(result).toEqual(response);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("POST");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorError on non-OK response", async () => {
        mockFetchError(400, "Bad Request");

        const client = new CloudmersiveconvertClient(TestConnectionUrl, createMockCredential());
        try {
            await client.createEditDocumentDocxBlankDocument({ InitialText: "Hello world" });
            throw new Error("Expected ConnectorError to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorError);
            const connectorError = error as ConnectorError;
            expect(connectorError.statusCode).toBe(400);
            expect(connectorError.responseBody).toBe("Bad Request");
        }
    });
});

describe("CloudmersiveconvertClient — multipart conversion", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST a multipart file through the generated operation", async () => {
        mockFetchResponse({});
        const client = new CloudmersiveconvertClient(TestConnectionUrl, createMockCredential());

        const result = await client.convertDocumentAutodetectToPdf({
            inputFile: new Blob(["document content"], { type: "text/plain" }),
        });

        expect(result).toBeInstanceOf(Blob);
        expect(await result.text()).toBe("{}");
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/convert/autodetect/to/pdf");
        expect(init.method).toBe("POST");
        expect(init.headers["Content-Type"]).toMatch(/^multipart\/form-data; boundary=/);
        expect(init.body).toBeDefined();
    });
});

describe("CloudmersiveDocumentConversion — connector registry", () => {
    it("should expose CloudmersiveDocumentConversion in ConnectorNames", () => {
        expect(ConnectorNames.CloudmersiveDocumentConversion).toBe("cloudmersiveconvert");
    });

    it("should include cloudmersiveconvert in availableConnectors", () => {
        expect(availableConnectors).toContain("cloudmersiveconvert");
    });
});
