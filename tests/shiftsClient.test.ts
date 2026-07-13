// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    ShiftsClient,
    ScheduleResponse,
    ListTimesOffResponse,
} from "../src/generated/ShiftsExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/shifts/abc123";

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

describe("ShiftsClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new ShiftsClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(ShiftsClient);
    });
});

describe("ShiftsClient — getScheduleAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET schedule for a team", async () => {
        const mockResponse: ScheduleResponse = { id: "sched-1" };
        mockFetchResponse(mockResponse);

        const client = new ShiftsClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getScheduleAsync("team-1");

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v1.0/teams/team-1/schedule");
        expect(init.method).toBe("GET");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, '{"error":"NotFound"}');

        const client = new ShiftsClient(TestConnectionUrl, createMockTokenProvider());
        await expect(client.getScheduleAsync("team-1")).rejects.toThrow(ConnectorException);
    });
});

describe("ShiftsClient — listTimesOffAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should include start/end/top query parameters", async () => {
        const mockResponse: ListTimesOffResponse = { value: [] };
        mockFetchResponse(mockResponse);

        const client = new ShiftsClient(TestConnectionUrl, createMockTokenProvider());
        await client.listTimesOffAsync("team-1", "2026-01-01", "2026-01-31", "10");

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("startTime=2026-01-01");
        expect(url).toContain("endTime=2026-01-31");
        expect(url).toContain("$top=10");
    });
});

describe("Shifts — connector registry", () => {
    it("should have shifts in ConnectorNames", () => {
        expect(ConnectorNames.ShiftsForMicrosoftTeams).toBe("shifts");
    });

    it("should include shifts in availableConnectors", () => {
        expect(availableConnectors).toContain("shifts");
    });
});
