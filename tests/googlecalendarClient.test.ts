// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { GoogleCalendarClient } from "../src/generated/GoogleCalendarExtensions.ts";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/googlecalendar/abc123";

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

describe("GoogleCalendarClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new GoogleCalendarClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(GoogleCalendarClient);
    });

    it("should strip trailing slashes from connection URL", async () => {
        mockFetchResponse({});
        const client = new GoogleCalendarClient(TestConnectionUrl + "///", createMockCredential());
        await client.getEvent("cal1", "evt1");
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        // NOTE: Confirms the trailing slashes were stripped by inspecting the
        //       outbound URL: after the scheme, no `//` should remain.
        expect(String(url).replace(/^https?:\/\//, "")).not.toContain("//");
        jest.restoreAllMocks();
    });

    it("should throw on null connection URL", () => {
        expect(() => new GoogleCalendarClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new GoogleCalendarClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("GoogleCalendarClient — getEvent", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET an event by calendar and event id and return the deserialized response", async () => {
        const event = { id: "evt1", subject: "Team Sync" };
        mockFetchResponse(event);

        const client = new GoogleCalendarClient(TestConnectionUrl, createMockCredential());
        const result = await client.getEvent("cal1", "evt1");

        expect(result).toEqual(event);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(url).toContain("/calendars/cal1");
        expect(url).toContain("/events/evt1");
    });

    it("should throw ConnectorError on non-OK response", async () => {
        mockFetchError(404, "Not Found");

        const client = new GoogleCalendarClient(TestConnectionUrl, createMockCredential());
        try {
            await client.getEvent("cal1", "missing");
            throw new Error("Expected ConnectorError to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorError);
            const connectorError = error as ConnectorError;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe("Not Found");
            expect(connectorError.operation).toBe("GetEvent");
            expect(connectorError.request.url).toContain("/calendars/cal1/events/missing");
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
