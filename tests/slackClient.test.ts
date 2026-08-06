// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    SlackClient,
    ListChannelsResponse,
    PostMessageRequest,
    PostMessageResponse,
} from "../src/generated/SlackExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/slack/abc123";

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

describe("SlackClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new SlackClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(SlackClient);
    });
});

describe("SlackClient — listChannelsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET channels list", async () => {
        const mockResponse: ListChannelsResponse = { value: [] };
        mockFetchResponse(mockResponse);

        const client = new SlackClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.listChannelsAsync();

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v3/conversations.list");
        expect(init.method).toBe("GET");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(429, '{"error":"rate_limited"}');

        const client = new SlackClient(TestConnectionUrl, createMockTokenProvider());
        await expect(client.listChannelsAsync()).rejects.toThrow(ConnectorException);
    });
});

describe("SlackClient — postMessageAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST message payload", async () => {
        const input: PostMessageRequest = {
            channel: "C123",
            text: "hello",
        };
        const mockResponse: PostMessageResponse = { ok: true, channel: "C123" };
        mockFetchResponse(mockResponse);

        const client = new SlackClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.postMessageAsync(input);

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v2/chat.postMessage");
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("Slack — connector registry", () => {
    it("should have slack in ConnectorNames", () => {
        expect(ConnectorNames.Slack).toBe("slack");
    });

    it("should include slack in availableConnectors", () => {
        expect(availableConnectors).toContain("slack");
    });
});
