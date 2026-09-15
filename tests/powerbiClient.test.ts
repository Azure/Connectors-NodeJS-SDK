// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    PowerbiClient,
    ListedScorecards,
    CreateScorecardRequest,
    CreatedScorecard,
} from "../src/generated/PowerbiExtensions.ts";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/powerbi/abc123";

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

describe("PowerbiClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new PowerbiClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(PowerbiClient);
    });
});

describe("PowerbiClient — getScorecards", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET scorecards and include pbi_source query", async () => {
        const mockResponse: ListedScorecards = {};
        mockFetchResponse(mockResponse);

        const client = new PowerbiClient(TestConnectionUrl, createMockCredential());
        const result = await client.getScorecards("group-1", "firstparty");

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v1.0/myOrg/groups/group-1/internalScorecards");
        expect(url).toContain("pbi_source=firstparty");
        expect(init.method).toBe("GET");
    });

    it("should throw ConnectorError on non-OK response", async () => {
        mockFetchError(401, '{"error":"Unauthorized"}');

        const client = new PowerbiClient(TestConnectionUrl, createMockCredential());
        await expect(client.getScorecards("group-1")).rejects.toThrow(ConnectorError);
    });
});

describe("PowerbiClient — createScorecard", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST scorecard payload", async () => {
        const input: CreateScorecardRequest = { name: "Q3 Goals" };
        const mockResponse: CreatedScorecard = { id: "scorecard-1" };
        mockFetchResponse(mockResponse);

        const client = new PowerbiClient(TestConnectionUrl, createMockCredential());
        const result = await client.createScorecard(input, "group-1");

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/internalScorecards");
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("Power BI — connector registry", () => {
    it("should have powerbi in ConnectorNames", () => {
        expect(ConnectorNames.PowerBI).toBe("powerbi");
    });

    it("should include powerbi in availableConnectors", () => {
        expect(availableConnectors).toContain("powerbi");
    });
});
