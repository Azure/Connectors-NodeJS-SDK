// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    Office365Client,
    DraftEmailInput,
    OutlookReceiveMessage,
    GraphOutlookCategory,
    SendEmailInput,
    GraphClientReceiveMessage,
    GraphCalendarEventClientReceive,
    GraphCalendarEventListClientReceive,
} from "../src/generated/Office365Extensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/office365/abc123";

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
// Type-level compile-time checks
// ──────────────────────────────────────────────

const _sendInput: SendEmailInput = {
    To: "user@example.com",
    Subject: "Test Subject",
    Body: "<p>Hello</p>",
};

const _draftInput: DraftEmailInput = {
    To: "user@example.com",
    Subject: "Draft Subject",
    Body: "Draft body",
};

const _category: GraphOutlookCategory = {
    id: "cat-1",
    displayName: "Test Category",
};

const _message: GraphClientReceiveMessage = {
    id: "msg-123",
    subject: "Re: Test",
    isRead: true,
};

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("Office365Client — constructor", () => {
    it("should construct with valid options", () => {
        const client = new Office365Client(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(Office365Client);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new Office365Client(TestConnectionUrl + "///", createMockTokenProvider());
        expect(client).toBeDefined();
    });

    it("should throw on null connection URL", () => {
        expect(() => new Office365Client(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new Office365Client(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("Office365Client — sendEmailAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/Mail with correct body and headers", async () => {
        mockFetchResponse(null);

        const client = new Office365Client(TestConnectionUrl, createMockTokenProvider());
        const input: SendEmailInput = {
            To: "user@example.com",
            Subject: "Test",
            Body: "Hello",
        };

        await client.sendEmailAsync(input);

        expect(global.fetch).toHaveBeenCalledTimes(1);

        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v2/Mail`);
        expect(init.method).toBe("POST");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(init.headers["Content-Type"]).toBe("application/json");
        expect(JSON.parse(init.body)).toEqual(input);
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(401, "Unauthorized");

        const client = new Office365Client(TestConnectionUrl, createMockTokenProvider());
        await expect(
            client.sendEmailAsync({ To: "x", Subject: "x", Body: "x" }),
        ).rejects.toThrow(ConnectorException);
    });
});

describe("Office365Client — getOutlookCategoryNamesAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET /Categories", async () => {
        const categories: GraphOutlookCategory[] = [
            { id: "1", displayName: "Red Category" },
            { id: "2", displayName: "Blue Category" },
        ];
        mockFetchResponse(categories);

        const client = new Office365Client(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getOutlookCategoryNamesAsync();

        expect(result).toEqual(categories);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/Categories`);
        expect(init.method).toBe("GET");
        expect(init.body).toBeUndefined();
    });
});

describe("Office365Client — draftEmailAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST with query parameters", async () => {
        const draftedMessage: OutlookReceiveMessage = { Id: "draft-1" };
        mockFetchResponse(draftedMessage);

        const client = new Office365Client(TestConnectionUrl, createMockTokenProvider());
        const input: DraftEmailInput = { To: "user@example.com", Subject: "Draft", Body: "<p>Hello</p>" };

        const result = await client.draftEmailAsync(input, "parent-msg-id", "reply");

        expect(result).toEqual(draftedMessage);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/Draft?");
        expect(url).toContain("messageId=parent-msg-id");
        expect(url).toContain("draftType=reply");
    });
});

describe("Office365Client — getEmailAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should deserialize JSON response", async () => {
        const mockMessage: GraphClientReceiveMessage = {
            id: "abc-123",
            subject: "Hello",
            isRead: false,
        };
        mockFetchResponse(mockMessage);

        const client = new Office365Client(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getEmailAsync("abc-123");

        expect(result.id).toBe("abc-123");
        expect(result.subject).toBe("Hello");
        expect(result.isRead).toBe(false);
    });

    it("should pass path parameters directly in URL", async () => {
        mockFetchResponse({});

        const client = new Office365Client(TestConnectionUrl, createMockTokenProvider());
        await client.getEmailAsync("msg-123");

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/msg-123");
    });
});

describe("Office365Client — calendarGetItemsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should build URL with OData query parameters", async () => {
        const mockResponse: GraphCalendarEventListClientReceive = {
            value: [{ subject: "Standup" }],
        };
        mockFetchResponse(mockResponse);

        const client = new Office365Client(TestConnectionUrl, createMockTokenProvider());
        const result = await client.calendarGetItemsAsync(
            "calendar-1",
            undefined,
            "start desc",
            "5",
        );

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain(encodeURIComponent("calendar-1"));
        expect(url).toContain("$orderby=");
        expect(url).toContain("$top=5");
        expect(result.value).toHaveLength(1);
    });
});

describe("Office365Client — deleteEmailAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should send DELETE request", async () => {
        mockFetchResponse(null);

        const client = new Office365Client(TestConnectionUrl, createMockTokenProvider());
        await client.deleteEmailAsync("msg-to-delete");

        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("DELETE");
    });
});

describe("ConnectorException", () => {
    it("should include status code and response body", () => {
        const errorBody = '{"code": "Forbidden"}';
        const error = new ConnectorException("office365", "GET /test", 403, errorBody);

        expect(error.statusCode).toBe(403);
        expect(error.responseBody).toBe(errorBody);
        expect(error.operation).toBe("GET /test");
        expect(error.name).toBe("ConnectorException");
    });

    it("should truncate long error response bodies in message", () => {
        const longBody = "x".repeat(3000);
        const error = new ConnectorException("office365", "GET /test", 500, longBody);

        expect(error.message).toContain("...[truncated]");
        expect(error.responseBody).toBe(longBody);
        expect(error.responseBody.length).toBe(3000);
    });
});

describe("Office365 — connector registry", () => {
    it("should have office365 in ConnectorNames", () => {
        expect(ConnectorNames.Office365Outlook).toBe("office365");
    });

    it("should include office365 in availableConnectors", () => {
        expect(availableConnectors).toContain("office365");
    });
});
