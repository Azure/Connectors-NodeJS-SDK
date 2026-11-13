// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { PdfCoClient } from "../src/generated/PdfCoExtensions.ts";
import type {
    PdfFromXlsXlsxResponse,
    PdfUnsearchableResponse,
    XlsToCsvResponse,
    XlsToHtmlResponse,
    XlsToJsonResponse,
    XlsToTxtResponse,
    XlsToXmlResponse,
} from "../src/generated/PdfCoExtensions.ts";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/pdfco/abc123";

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

describe("PdfCoClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new PdfCoClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(PdfCoClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new PdfCoClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new PdfCoClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("PdfCoClient — urlToPdf", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST the URL-to-PDF request and return the deserialized response", async () => {
        const response = { url: "https://pdf.co/output/document.pdf", pageCount: 1, error: false };
        mockFetchResponse(response);

        const client = new PdfCoClient(TestConnectionUrl, createMockCredential());
        const result = await client.urlToPdf({ url: "https://example.com/page.html" });

        expect(result).toEqual(response);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("POST");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorError on non-OK response", async () => {
        mockFetchError(400, "Bad Request");

        const client = new PdfCoClient(TestConnectionUrl, createMockCredential());
        try {
            await client.urlToPdf({ url: "https://example.com/page.html" });
            throw new Error("Expected ConnectorError to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorError);
            const connectorError = error as ConnectorError;
            expect(connectorError.statusCode).toBe(400);
            expect(connectorError.responseBody).toBe("Bad Request");
        }
    });
});

describe("PDFco — connector registry", () => {
    it("should expose PDFco in ConnectorNames", () => {
        expect(ConnectorNames.PDFco).toBe("pdfco");
    });

    describe("PdfCoClient — reviewed response model names", () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        const inputUrl = "https://example.com/source";
        const conversions = [
            {
                name: "PdfUnsearchableResponse",
                operationId: "PDFUnSearchable",
                path: "/v1/pdf/makeunsearchable",
                invoke: (client: PdfCoClient): Promise<PdfUnsearchableResponse> =>
                    client.pdfUnsearchable({ url: inputUrl }),
            },
            {
                name: "PdfFromXlsXlsxResponse",
                operationId: "PDFFromXLSXLSX",
                path: "/v1/xls/convert/to/pdf",
                invoke: (client: PdfCoClient): Promise<PdfFromXlsXlsxResponse> =>
                    client.pdfFromXlsXlsx({ url: inputUrl }),
            },
            {
                name: "XlsToCsvResponse",
                operationId: "XLStoCSV",
                path: "/v1/xls/convert/to/csv",
                invoke: (client: PdfCoClient): Promise<XlsToCsvResponse> =>
                    client.xlsToCsv({ url: inputUrl }),
            },
            {
                name: "XlsToHtmlResponse",
                operationId: "XLStoHTML",
                path: "/v1/xls/convert/to/html",
                invoke: (client: PdfCoClient): Promise<XlsToHtmlResponse> =>
                    client.xlsToHtml({ url: inputUrl }),
            },
            {
                name: "XlsToJsonResponse",
                operationId: "XLStoJSON",
                path: "/v1/xls/convert/to/json",
                invoke: (client: PdfCoClient): Promise<XlsToJsonResponse> =>
                    client.xlsToJson({ url: inputUrl }),
            },
            {
                name: "XlsToTxtResponse",
                operationId: "XLStoTXT",
                path: "/v1/xls/convert/to/txt",
                invoke: (client: PdfCoClient): Promise<XlsToTxtResponse> =>
                    client.xlsToTxt({ url: inputUrl }),
            },
            {
                name: "XlsToXmlResponse",
                operationId: "XLStoXML",
                path: "/v1/xls/convert/to/xml",
                invoke: (client: PdfCoClient): Promise<XlsToXmlResponse> =>
                    client.xlsToXml({ url: inputUrl }),
            },
        ];

        it.each(conversions)("should retain the raw operation ID for $name", async ({ operationId, invoke }) => {
            mockFetchError(400, '{"error":"invalid file"}');
            const client = new PdfCoClient(TestConnectionUrl, createMockCredential());

            await expect(invoke(client)).rejects.toMatchObject({
                connectorName: "pdfco", operation: operationId, statusCode: 400,
            });
        });

        it.each(conversions)("should preserve the wire contract for $name", async ({ path, invoke }) => {
            const response = { url: "https://example.com/output", jobId: "job-123", status: 200 };
            mockFetchResponse(response);
            const client = new PdfCoClient(TestConnectionUrl, createMockCredential());

            const result = await invoke(client);

            expect(result).toEqual(response);
            expect(global.fetch).toHaveBeenCalledTimes(1);
            const [requestUrl, request] = jest.mocked(global.fetch).mock.calls[0];
            expect(String(requestUrl)).toBe(TestConnectionUrl + path);
            expect(request?.method).toBe("POST");
            expect(request?.body).toBe(JSON.stringify({ url: inputUrl }));
        });
    });

    it("should include pdfco in availableConnectors", () => {
        expect(availableConnectors).toContain("pdfco");
    });
});
