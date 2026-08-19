// Copyright (c) Microsoft Corporation.  All rights reserved.

import { GooglecalendarClient } from "../src/generated/GooglecalendarExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/googlecalendar/abc123";

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
// Runtime tests
// ──────────────────────────────────────────────

describe("GooglecalendarClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new GooglecalendarClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(GooglecalendarClient);
    });

    it("should strip trailing slashes from connection URL", async () => {
        mockFetchResponse({});
        const client = new GooglecalendarClient(TestConnectionUrl + "///", createMockTokenProvider());
        await client.getEventAsync("cal1", "evt1");
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        // NOTE: Confirms the trailing slashes were stripped by inspecting the
        //       outbound URL: after the scheme, no `//` should remain.
        expect(String(url).replace(/^https?:\/\//, "")).not.toContain("//");
        jest.restoreAllMocks();
    });

    it("should throw on null connection URL", () => {
        expect(() => new GooglecalendarClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new GooglecalendarClient(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("GooglecalendarClient — getEventAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET an event by calendar and event id and return the deserialized response", async () => {
        const event = { id: "evt1", subject: "Team Sync" };
        mockFetchResponse(event);

        const client = new GooglecalendarClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getEventAsync("cal1", "evt1");

        expect(result).toEqual(event);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(url).toContain("/calendars/cal1");
        expect(url).toContain("/events/evt1");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, "Not Found");

        const client = new GooglecalendarClient(TestConnectionUrl, createMockTokenProvider());
        try {
            await client.getEventAsync("cal1", "missing");
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe("Not Found");
            expect(connectorError.operation).toBe("GET /calendars/cal1/events/missing");
        }
    });
});

describe("Googlecalendar — connector registry", () => {
    it("should expose GoogleCalendar in ConnectorNames", () => {
        expect(ConnectorNames.GoogleCalendar).toBe("googlecalendar");
    });

    it("should include googlecalendar in availableConnectors", () => {
        expect(availableConnectors).toContain("googlecalendar");
    });
});
