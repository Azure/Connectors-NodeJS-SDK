// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    JoinChannelResponse,
    SlackClient,
    ListChannelsResponse,
    PostMessageRequest,
    PostMessageResponse,
} from "../src/generated/SlackExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/slack/abc123";

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

describe("SlackClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new SlackClient(TestConnectionUrl, createMockCredential());
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

        const client = new SlackClient(TestConnectionUrl, createMockCredential());
        const result = await client.listChannelsAsync().byPage().next();

        expect(result.value).toEqual(mockResponse.value);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v3/conversations.list");
        expect(init.method).toBe("GET");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(429, '{"error":"rate_limited"}');

        const client = new SlackClient(TestConnectionUrl, createMockCredential());
        await expect(client.listChannelsAsync().byPage().next()).rejects.toThrow(ConnectorException);
    });
});

describe("SlackClient — joinChannelAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should return the retained join-channel response shape", async () => {
        const mockResponse: JoinChannelResponse = {
            channel: { id: "C123", name: "general" },
            warning: "already_in_channel",
        };
        mockFetchResponse(mockResponse);

        const client = new SlackClient(TestConnectionUrl, createMockCredential());
        const result = await client.joinChannelAsync("C123");

        expect(result.warning).toBe("already_in_channel");
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/conversations.join?channel=C123`);
        expect(init.method).toBe("POST");
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

        const client = new SlackClient(TestConnectionUrl, createMockCredential());
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
