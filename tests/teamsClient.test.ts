// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    TeamsClient,
    NewMeeting,
    NewMeetingRespone,
    GetAllTeamsResponse,
    GetChannelsForGroupResponse,
    CreateChannelInput,
    CreateChannelResponse,
    GetTagsResponseSchema,
} from "../src/generated/TeamsExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/teams/abc123";

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

const _meeting: NewMeeting = {
    subject: "Team Standup",
    body: { content: "Discussion" },
    timeZone: "Pacific Standard Time",
    start: { dateTime: "2024-01-01T09:00:00" },
    end: { dateTime: "2024-01-01T09:30:00" },
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
};

const _meetingResponse: NewMeetingRespone = {
    id: "meeting-1",
    subject: "Team Standup",
};

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("TeamsClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new TeamsClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(TeamsClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new TeamsClient(TestConnectionUrl + "///", createMockTokenProvider());
        expect(client).toBeDefined();
    });

    it("should throw on null connection URL", () => {
        expect(() => new TeamsClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new TeamsClient(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("TeamsClient — getAllTeamsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET /beta/me/joinedTeams", async () => {
        const mockResponse: GetAllTeamsResponse = {
            value: [{ id: "team-1", displayName: "Engineering" }],
        };
        mockFetchResponse(mockResponse);

        const client = new TeamsClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getAllTeamsAsync();

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/beta/me/joinedTeams`);
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });
});

describe("TeamsClient — createTeamsMeetingAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST meeting with body to calendar endpoint", async () => {
        const mockResponse: NewMeetingRespone = {
            id: "event-1",
            subject: "Standup",
        };
        mockFetchResponse(mockResponse);

        const client = new TeamsClient(TestConnectionUrl, createMockTokenProvider());
        const input: NewMeeting = {
            subject: "Standup",
            body: { content: "Discussion" },
            timeZone: "Pacific Standard Time",
            start: { dateTime: "2024-01-01T09:00:00" },
            end: { dateTime: "2024-01-01T09:30:00" },
            isOnlineMeeting: true,
            onlineMeetingProvider: "teamsForBusiness",
        };

        const result = await client.createTeamsMeetingAsync(input, "calendar-1");

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v1.0/me/calendars/");
        expect(url).toContain(encodeURIComponent("calendar-1"));
        expect(url).toContain("/events");
        expect(init.method).toBe("POST");
        expect(init.headers["Content-Type"]).toBe("application/json");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("TeamsClient — getChannelsForGroupAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should include team ID in URL path", async () => {
        const mockResponse: GetChannelsForGroupResponse = {
            value: [{ id: "ch-1", displayName: "General" }],
        };
        mockFetchResponse(mockResponse);

        const client = new TeamsClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getChannelsForGroupAsync("team-123");

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/team-123/channels");
    });

    it("should include query parameters when provided", async () => {
        mockFetchResponse({ value: [] });

        const client = new TeamsClient(TestConnectionUrl, createMockTokenProvider());
        await client.getChannelsForGroupAsync("team-1", "$filter=name eq 'General'");

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("$filter=");
    });
});

describe("TeamsClient — createChannelAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST new channel with body", async () => {
        const mockResponse: CreateChannelResponse = {
            id: "ch-new",
            displayName: "New Channel",
        };
        mockFetchResponse(mockResponse);

        const client = new TeamsClient(TestConnectionUrl, createMockTokenProvider());
        const input: CreateChannelInput = {
            displayName: "New Channel",
        };

        const result = await client.createChannelAsync(input, "team-1");

        expect(result).toEqual(mockResponse);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("TeamsClient — getTagsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET tags for a team", async () => {
        const mockResponse: GetTagsResponseSchema = {
            value: [{ id: "tag-1", displayName: "Reviewers" }],
        };
        mockFetchResponse(mockResponse);

        const client = new TeamsClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getTagsAsync("team-1");

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/beta/teams/");
        expect(url).toContain("/tags");
    });
});

describe("TeamsClient — deleteTagAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should send DELETE request", async () => {
        mockFetchResponse(null);

        const client = new TeamsClient(TestConnectionUrl, createMockTokenProvider());
        await client.deleteTagAsync("team-1", "tag-1");

        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("DELETE");
    });
});

describe("TeamsClient — error handling", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(403, '{"error": "Access denied"}');

        const client = new TeamsClient(TestConnectionUrl, createMockTokenProvider());

        await expect(client.getAllTeamsAsync()).rejects.toThrow(
        );
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "NotFound"}';
        mockFetchError(404, errorBody);

        const client = new TeamsClient(TestConnectionUrl, createMockTokenProvider());

        try {
            await client.getAllTeamsAsync();
            throw new Error("Expected ConnectorException to be thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe(errorBody);
            expect(connectorError.operation).toContain("GET");
        }
    });

    it("should truncate long error response bodies in message", () => {
        const longBody = "x".repeat(3000);
        const error = new ConnectorException("GET /test", 500, longBody);

        expect(error.message).toContain("...[truncated]");
        expect(error.responseBody).toBe(longBody);
    });
});

describe("Teams — connector registry", () => {
    it("should have teams in ConnectorNames", () => {
        expect(ConnectorNames.Teams).toBe("teams");
    });

    it("should include teams in availableConnectors", () => {
        expect(availableConnectors).toContain("teams");
    });
});
