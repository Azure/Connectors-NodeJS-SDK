// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    Office365usersClient,
    GraphUser,
    GraphUserUpdateableV1,
    EntityListResponseIReadOnlyListUser,
    DirectReportsResponse,
    ClientPhotoMetadata,
    MyTrendingDocumentsResponse,
    LinklessEntityListResponseListPerson,
} from "../src/generated/Office365usersExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/office365users/abc123";

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

const _user: GraphUser = {
    DisplayName: "John Doe",
    Mail: "john@contoso.com",
};

const _updateInput: GraphUserUpdateableV1 = {
    aboutMe: "Software engineer",
};

const _photoMetadata: ClientPhotoMetadata = {};

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("Office365usersClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new Office365usersClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(Office365usersClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new Office365usersClient(TestConnectionUrl + "///", createMockTokenProvider());
        expect(client).toBeDefined();
    });
});

describe("Office365usersClient — myProfileAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET /codeless/v1.0/me", async () => {
        const mockProfile: GraphUser = {
            DisplayName: "Jane Doe",
            Mail: "jane@contoso.com",
        };
        mockFetchResponse(mockProfile);

        const client = new Office365usersClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.myProfileAsync();

        expect(result).toEqual(mockProfile);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/codeless/v1.0/me");
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });

    it("should include select query parameter when provided", async () => {
        mockFetchResponse({});

        const client = new Office365usersClient(TestConnectionUrl, createMockTokenProvider());
        await client.myProfileAsync("displayName,mail");

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("$select=");
    });
});

describe("Office365usersClient — searchUserAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET /v2/users with search term", async () => {
        const mockResponse: EntityListResponseIReadOnlyListUser = {
            value: [{ DisplayName: "John" }],
        };
        mockFetchResponse(mockResponse);

        const client = new Office365usersClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.searchUserAsync("John");

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v2/users");
        expect(url).toContain("searchTerm=John");
    });
});

describe("Office365usersClient — managerAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET manager for a user", async () => {
        const mockManager: GraphUser = { DisplayName: "Boss Person" };
        mockFetchResponse(mockManager);

        const client = new Office365usersClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.managerAsync("user-123");

        expect(result).toEqual(mockManager);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v1.0/users/user-123/manager");
    });
});

describe("Office365usersClient — directReportsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET direct reports for a user", async () => {
        const mockResponse: DirectReportsResponse = {
            value: [{ displayName: "Report 1" }],
        };
        mockFetchResponse(mockResponse);

        const client = new Office365usersClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.directReportsAsync("user-123");

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v1.0/users/user-123/directReports");
    });
});

describe("Office365usersClient — updateMyProfileAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should PATCH /codeless/v1.0/me with body", async () => {
        mockFetchResponse(null);

        const client = new Office365usersClient(TestConnectionUrl, createMockTokenProvider());
        const input: GraphUserUpdateableV1 = { aboutMe: "Updated bio" };

        await client.updateMyProfileAsync(input);

        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/codeless/v1.0/me");
        expect(init.method).toBe("PATCH");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("Office365usersClient — relevantPeopleAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET relevant people for a user", async () => {
        const mockResponse: LinklessEntityListResponseListPerson = {
            value: [{ DisplayName: "Colleague" }],
        };
        mockFetchResponse(mockResponse);

        const client = new Office365usersClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.relevantPeopleAsync("user-123");

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/users/user-123/relevantpeople");
    });
});

describe("Office365usersClient — myTrendingDocumentsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET trending documents for current user", async () => {
        const mockResponse: MyTrendingDocumentsResponse = {
            value: [{ weight: 100 }],
        };
        mockFetchResponse(mockResponse);

        const client = new Office365usersClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.myTrendingDocumentsAsync();

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/codeless/beta/me/insights/trending");
    });
});

describe("Office365usersClient — error handling", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(401, '{"error": "InvalidAuthenticationToken"}');

        const client = new Office365usersClient(TestConnectionUrl, createMockTokenProvider());

        await expect(client.myProfileAsync()).rejects.toThrow(ConnectorException);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "Request_ResourceNotFound"}';
        mockFetchError(404, errorBody);

        const client = new Office365usersClient(TestConnectionUrl, createMockTokenProvider());

        try {
            await client.managerAsync("nonexistent-user");
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe(errorBody);
            expect(connectorError.operation).toContain("GET");
        }
    });
});

describe("Office365users — connector registry", () => {
    it("should have office365users in ConnectorNames", () => {
        expect(ConnectorNames.Office365users).toBe("office365users");
    });

    it("should include office365users in availableConnectors", () => {
        expect(availableConnectors).toContain("office365users");
    });
});
