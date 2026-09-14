// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    Office365usersClient,
    GraphUser,
    GraphUserUpdateable,
    EntityListResponseIReadOnlyListUser,
    DirectReportsResponse,
    ClientPhotoMetadata,
    MyTrendingDocumentsResponse,
    LinklessEntityListResponseListPerson,
} from "../src/generated/Office365usersExtensions.ts";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/office365users/abc123";

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
// Type-level compile-time checks
// ──────────────────────────────────────────────

const _user: GraphUser = {
    displayName: "John Doe",
    mail: "john@contoso.com",
};

const _updateInput: GraphUserUpdateable = {
    aboutMe: "Software engineer",
};

const _photoMetadata: ClientPhotoMetadata = {};

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("Office365usersClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new Office365usersClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(Office365usersClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new Office365usersClient(TestConnectionUrl + "///", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should construct with an empty connection URL", () => {
        const client = new Office365usersClient("", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should throw on null connection URL", () => {
        expect(() => new Office365usersClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new Office365usersClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("Office365usersClient — myProfile", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET /codeless/v1.0/me", async () => {
        const mockProfile: GraphUser = {
            displayName: "Jane Doe",
            mail: "jane@contoso.com",
        };
        mockFetchResponse(mockProfile);

        const client = new Office365usersClient(TestConnectionUrl, createMockCredential());
        const result = await client.myProfile();

        expect(result).toEqual(mockProfile);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/codeless/v1.0/me");
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should include select query parameter when provided", async () => {
        mockFetchResponse({});

        const client = new Office365usersClient(TestConnectionUrl, createMockCredential());
        await client.myProfile("displayName,mail");

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("$select=");
    });
});

describe("Office365usersClient — searchUser", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET /v2/users with search term", async () => {
        const mockResponse: EntityListResponseIReadOnlyListUser = {
            value: [{ Id: "user-1", DisplayName: "John" }],
        };
        mockFetchResponse(mockResponse);

        const client = new Office365usersClient(TestConnectionUrl, createMockCredential());
        const result = await client.searchUser("John").byPage().next();

        expect(result.value).toEqual(mockResponse.value);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v2/users");
        expect(url).toContain("searchTerm=John");
    });
});

describe("Office365usersClient — manager", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET manager for a user", async () => {
        const mockManager: GraphUser = { displayName: "Boss Person" };
        mockFetchResponse(mockManager);

        const client = new Office365usersClient(TestConnectionUrl, createMockCredential());
        const result = await client.manager("user-123");

        expect(result).toEqual(mockManager);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v1.0/users/user-123/manager");
    });
});

describe("Office365usersClient — directReports", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET direct reports for a user", async () => {
        const mockResponse: DirectReportsResponse = {
            value: [{ displayName: "Report 1" }],
        };
        mockFetchResponse(mockResponse);

        const client = new Office365usersClient(TestConnectionUrl, createMockCredential());
        const result = await client.directReports("user-123");

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v1.0/users/user-123/directReports");
    });
});

describe("Office365usersClient — updateMyProfile", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should PATCH /codeless/v1.0/me with body", async () => {
        mockFetchResponse(null);

        const client = new Office365usersClient(TestConnectionUrl, createMockCredential());
        const input: GraphUserUpdateable = { aboutMe: "Updated bio" };

        await client.updateMyProfile(input);

        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/codeless/v1.0/me");
        expect(init.method).toBe("PATCH");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("Office365usersClient — relevantPeople", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET relevant people for a user", async () => {
        const mockResponse: LinklessEntityListResponseListPerson = {
            value: [{ displayName: "Colleague" }],
        };
        mockFetchResponse(mockResponse);

        const client = new Office365usersClient(TestConnectionUrl, createMockCredential());
        const result = await client.relevantPeople("user-123");

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/users/user-123/relevantpeople");
    });
});

describe("Office365usersClient — myTrendingDocuments", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET trending documents for current user", async () => {
        const mockResponse: MyTrendingDocumentsResponse = {
            value: [{ weight: 100 }],
        };
        mockFetchResponse(mockResponse);

        const client = new Office365usersClient(TestConnectionUrl, createMockCredential());
        const result = await client.myTrendingDocuments();

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/codeless/beta/me/insights/trending");
    });
});

describe("Office365usersClient — error handling", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw ConnectorError on non-OK response", async () => {
        mockFetchError(401, '{"error": "InvalidAuthenticationToken"}');

        const client = new Office365usersClient(TestConnectionUrl, createMockCredential());

        await expect(client.myProfile()).rejects.toThrow(ConnectorError);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "Request_ResourceNotFound"}';
        mockFetchError(404, errorBody);

        const client = new Office365usersClient(TestConnectionUrl, createMockCredential());

        try {
            await client.manager("nonexistent-user");
            throw new Error("Expected ConnectorError to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorError);
            const connectorError = error as ConnectorError;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe(errorBody);
            expect(connectorError.operation).toContain("GET");
        }
    });
});

describe("Office365users — connector registry", () => {
    it("should have office365users in ConnectorNames", () => {
        expect(ConnectorNames.Office365Users).toBe("office365users");
    });

    it("should include office365users in availableConnectors", () => {
        expect(availableConnectors).toContain("office365users");
    });
});
