// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    SalesforceClient,
    TablesList,
    GetItemByExternalIdResponse,
} from "../src/generated/SalesforceExtensions.ts";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/salesforce/abc123";

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

describe("SalesforceClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new SalesforceClient(
            TestConnectionUrl,
            createMockCredential(),
            { retryOptions: { maxRetries: 0 } },
        );
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(SalesforceClient);
    });
});

describe("SalesforceClient — getTables", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET object types", async () => {
        const mockResponse: TablesList = { value: [] };
        mockFetchResponse(mockResponse);

        const client = new SalesforceClient(TestConnectionUrl, createMockCredential());
        const result = await client.getTables().byPage().next();

        expect(result.value).toEqual(mockResponse.value);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/datasets/default/tables");
        expect(init.method).toBe("GET");
    });

    it("should throw ConnectorError on non-OK response", async () => {
        mockFetchError(500, '{"error":"Internal"}');

        const client = new SalesforceClient(
            TestConnectionUrl,
            createMockCredential(),
            { retryOptions: { maxRetries: 0 } },
        );
        await expect(client.getTables().byPage().next()).rejects.toThrow(ConnectorError);
    });
});

describe("SalesforceClient — getItemByExternalId", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should include table and external id route parameters", async () => {
        const mockResponse: GetItemByExternalIdResponse = {};
        mockFetchResponse(mockResponse);

        const client = new SalesforceClient(TestConnectionUrl, createMockCredential());
        await client.getItemByExternalId("Account", "ExternalId", "ABC123");

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/tables/Account/externalIdFields/ExternalId/ABC123");
    });
});

describe("Salesforce — connector registry", () => {
    it("should have salesforce in ConnectorNames", () => {
        expect(ConnectorNames.Salesforce).toBe("salesforce");
    });

    it("should include salesforce in availableConnectors", () => {
        expect(availableConnectors).toContain("salesforce");
    });
});
