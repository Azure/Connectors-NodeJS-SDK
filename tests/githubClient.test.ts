// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    GithubClient,
    RepositoryDetails,
    GeneralAPIModel,
} from "../src/generated/GithubExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/github/abc123";

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

describe("GithubClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new GithubClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(GithubClient);
    });
});

describe("GithubClient — getRepositoryByIdAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET repository by id", async () => {
        const mockResponse: RepositoryDetails = { id: 123, name: "repo" };
        mockFetchResponse(mockResponse);

        const client = new GithubClient(TestConnectionUrl, createMockCredential());
        const result = await client.getRepositoryByIdAsync("123");

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/repositories/123");
        expect(init.method).toBe("GET");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, '{"error":"NotFound"}');

        const client = new GithubClient(TestConnectionUrl, createMockCredential());
        await expect(client.getRepositoryByIdAsync("123")).rejects.toThrow(ConnectorException);
    });
});

describe("GithubClient — getPullRequestsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should include state query parameter when provided", async () => {
        const mockResponse: GeneralAPIModel[] = [];
        mockFetchResponse(mockResponse);

        const client = new GithubClient(TestConnectionUrl, createMockCredential());
        await client.getPullRequestsAsync("owner", "repo", "open");

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/repos/owner/repo/pulls");
        expect(url).toContain("state=open");
    });
});

describe("Github — connector registry", () => {
    it("should have github in ConnectorNames", () => {
        expect(ConnectorNames.GitHub).toBe("github");
    });

    it("should include github in availableConnectors", () => {
        expect(availableConnectors).toContain("github");
    });
});
