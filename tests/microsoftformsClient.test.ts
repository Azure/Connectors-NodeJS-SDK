// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    MicrosoftformsClient,
    GetFormDetailsByIdResult,
    GetFormResponseByIdResult,
} from "../src/generated/MicrosoftformsExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/microsoftforms/abc123";

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

describe("MicrosoftformsClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new MicrosoftformsClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(MicrosoftformsClient);
    });
});

describe("MicrosoftformsClient — getFormDetailsByIdAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET form details and include $select query", async () => {
        const mockResponse: GetFormDetailsByIdResult = {};
        mockFetchResponse(mockResponse);

        const client = new MicrosoftformsClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getFormDetailsByIdAsync("form-1", "id,title");

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/formapi/api/forms('form-1')");
        expect(url).toContain("$select=");
        expect(init.method).toBe("GET");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(400, '{"error":"BadRequest"}');

        const client = new MicrosoftformsClient(TestConnectionUrl, createMockTokenProvider());
        await expect(client.getFormDetailsByIdAsync("form-1")).rejects.toThrow(ConnectorException);
    });
});

describe("MicrosoftformsClient — getFormResponseByIdAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should include response_id query when provided", async () => {
        const mockResponse: GetFormResponseByIdResult = {};
        mockFetchResponse(mockResponse);

        const client = new MicrosoftformsClient(TestConnectionUrl, createMockTokenProvider());
        await client.getFormResponseByIdAsync("form-1", "resp-2");

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/responses");
        expect(url).toContain("response_id=resp-2");
    });
});

describe("Microsoft Forms — connector registry", () => {
    it("should have microsoftforms in ConnectorNames", () => {
        expect(ConnectorNames.MicrosoftForms).toBe("microsoftforms");
    });

    it("should include microsoftforms in availableConnectors", () => {
        expect(availableConnectors).toContain("microsoftforms");
    });
});
