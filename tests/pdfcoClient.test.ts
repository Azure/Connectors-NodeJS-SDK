// Copyright (c) Microsoft Corporation.  All rights reserved.

import { PdfcoClient } from "../src/generated/PdfcoExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/pdfco/abc123";

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

describe("PdfcoClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new PdfcoClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(PdfcoClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new PdfcoClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new PdfcoClient(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("PdfcoClient — urlToPdfAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST the URL-to-PDF request and return the deserialized response", async () => {
        const response = { url: "https://pdf.co/output/document.pdf", pageCount: 1, error: false };
        mockFetchResponse(response);

        const client = new PdfcoClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.urlToPdfAsync({ url: "https://example.com/page.html" });

        expect(result).toEqual(response);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("POST");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(400, "Bad Request");

        const client = new PdfcoClient(TestConnectionUrl, createMockTokenProvider());
        try {
            await client.urlToPdfAsync({ url: "https://example.com/page.html" });
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(400);
            expect(connectorError.responseBody).toBe("Bad Request");
        }
    });
});

describe("PDFco — connector registry", () => {
    it("should expose PDFco in ConnectorNames", () => {
        expect(ConnectorNames.PDFco).toBe("pdfco");
    });

    it("should include pdfco in availableConnectors", () => {
        expect(availableConnectors).toContain("pdfco");
    });
});
