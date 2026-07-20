// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    DocusignClient,
    EnvelopeResendResponse,
} from "../src/generated/DocusignExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/docusign/abc123";

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

describe("DocusignClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new DocusignClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(DocusignClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new DocusignClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("DocusignClient — resendEnvelopeAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should PUT to resend envelope endpoint", async () => {
        const mockResponse: EnvelopeResendResponse = {};
        mockFetchResponse(mockResponse);

        const client = new DocusignClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.resendEnvelopeAsync("env-123");

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/envelopes/env-123/resendEnvelope");
        expect(init.method).toBe("PUT");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(400, '{"error":"BadRequest"}');

        const client = new DocusignClient(TestConnectionUrl, createMockTokenProvider());
        await expect(client.resendEnvelopeAsync("env-123")).rejects.toThrow(ConnectorException);
    });
});

describe("Docusign — connector registry", () => {
    it("should have docusign in ConnectorNames", () => {
        expect(ConnectorNames.Docusign).toBe("docusign");
    });

    it("should include docusign in availableConnectors", () => {
        expect(availableConnectors).toContain("docusign");
    });
});
