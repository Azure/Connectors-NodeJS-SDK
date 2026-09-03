// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    ForwardPostBody,
    Office365groupsmailClient,
} from "../src/generated/Office365groupsmailExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/office365groupsmail/abc123";

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

describe("Office365groupsmailClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new Office365groupsmailClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(Office365groupsmailClient);
    });

    it("should strip trailing slashes from connection URL", async () => {
        mockFetchResponse([]);
        const client = new Office365groupsmailClient(TestConnectionUrl + "///", createMockCredential());
        await client.listConversationsAsync("group1").byPage().next();
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        // NOTE: Confirms the trailing slashes were stripped by inspecting the
        //       outbound URL: after the scheme, no `//` should remain.
        expect(String(url).replace(/^https?:\/\//, "")).not.toContain("//");
        jest.restoreAllMocks();
    });

    it("should throw on null connection URL", () => {
        expect(() => new Office365groupsmailClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new Office365groupsmailClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("Office365groupsmailClient — listConversationsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET conversations for a group and return the deserialized response", async () => {
        const conversations = { value: [{ id: "conv1", topic: "Welcome" }] };
        mockFetchResponse(conversations);

        const client = new Office365groupsmailClient(TestConnectionUrl, createMockCredential());
        const result = await client.listConversationsAsync("group1").byPage().next();

        expect(result.value).toEqual(conversations.value);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(url).toContain("/groups/group1/conversations");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(403, "Forbidden");

        const client = new Office365groupsmailClient(TestConnectionUrl, createMockCredential());
        try {
            await client.listConversationsAsync("group1").byPage().next();
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(403);
            expect(connectorError.responseBody).toBe("Forbidden");
            expect(connectorError.operation).toBe("GET /v1.0/groups/group1/conversations");
        }
    });
});

describe("Office365groupsmailClient — forwardAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST the current ForwardPost_V2 request shape", async () => {
        mockFetchResponse(null);
        const input: ForwardPostBody = {
            Comment: "Please review this post.",
            ToRecipients: [{ EmailAddress: { address: "recipient@example.com" } }],
        };

        const client = new Office365groupsmailClient(TestConnectionUrl, createMockCredential());
        await client.forwardAsync(input, "group1", "conversation1", "thread1", "post1");

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        const requestBody = JSON.parse(init.body);
        expect(url).toBe(
            `${TestConnectionUrl}/beta/groups/group1/conversations/conversation1/threads/thread1/posts/post1/forward`,
        );
        expect(init.method).toBe("POST");
        expect(requestBody).toEqual(input);
        expect(requestBody).toHaveProperty("Comment");
        expect(requestBody).toHaveProperty("ToRecipients");
        expect(requestBody).not.toHaveProperty("comment");
        expect(requestBody).not.toHaveProperty("toRecipients");
    });
});

describe("Office365groupsmail — connector registry", () => {
    it("should expose Office365GroupsMail in ConnectorNames", () => {
        expect(ConnectorNames.Office365GroupsMail).toBe("office365groupsmail");
    });

    it("should include office365groupsmail in availableConnectors", () => {
        expect(availableConnectors).toContain("office365groupsmail");
    });
});
