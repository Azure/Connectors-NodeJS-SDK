// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    JiraClient,
    ListIssuesResponse,
} from "../src/generated/JiraExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/jira/abc123";

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

describe("JiraClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new JiraClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(JiraClient);
    });
});

describe("JiraClient — listResourcesAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET list of resources", async () => {
        const mockResponse: Array<Record<string, unknown>> = [{ id: "res-1" }];
        mockFetchResponse(mockResponse);

        const client = new JiraClient(TestConnectionUrl, createMockCredential());
        const result = await client.listResourcesAsync();

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/oauth/token/accessible-resources");
        expect(init.method).toBe("GET");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(403, '{"error":"Forbidden"}');

        const client = new JiraClient(TestConnectionUrl, createMockCredential());
        await expect(client.listResourcesAsync()).rejects.toThrow(ConnectorException);
    });
});

describe("JiraClient — listIssuesAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should include jql query parameter when provided", async () => {
        const mockResponse: ListIssuesResponse = {};
        mockFetchResponse(mockResponse);

        const client = new JiraClient(TestConnectionUrl, createMockCredential());
        await client.listIssuesAsync("project = DEMO", "names", "summary");

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/2/search");
        expect(url).toContain("jql=");
        expect(url).toContain("expand=");
        expect(url).toContain("fields=");
    });
});

describe("Jira — connector registry", () => {
    it("should have jira in ConnectorNames", () => {
        expect(ConnectorNames.Jira).toBe("jira");
    });

    it("should include jira in availableConnectors", () => {
        expect(availableConnectors).toContain("jira");
    });
});
