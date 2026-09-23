// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    MsgraphgroupsanduserClient,
    ListUsersResponse,
    ListGroupsByDisplayNameSearchResponse,
    ListSubscribedSkusResponse,
    ListDirectGroupMembersResponse,
    GetMemberLicenseDetailsResponse,
    GetGroupPropertiesResponse,
    GetMemberGroupsInput,
    GetMemberGroupsResponse,
} from "../src/generated/MsgraphgroupsanduserExtensions.ts";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/msgraphgroupsanduser/abc123";

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

const _memberGroupsInput: GetMemberGroupsInput = {
    securityEnabledOnly: true,
};

const _groupProperties: GetGroupPropertiesResponse = {
    id: "group-1",
    displayName: "Engineering",
};

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("MsgraphgroupsanduserClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new MsgraphgroupsanduserClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(MsgraphgroupsanduserClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new MsgraphgroupsanduserClient(TestConnectionUrl + "///", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should construct with an empty connection URL", () => {
        const client = new MsgraphgroupsanduserClient("", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should throw on null connection URL", () => {
        expect(() => new MsgraphgroupsanduserClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new MsgraphgroupsanduserClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("MsgraphgroupsanduserClient — listUsers", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET /v1.0/users", async () => {
        const mockResponse: ListUsersResponse = {
            value: [{ displayName: "John Doe", mail: "john@contoso.com" }],
        };
        mockFetchResponse(mockResponse);

        const client = new MsgraphgroupsanduserClient(TestConnectionUrl, createMockCredential());
        const result = await client.listUsers().byPage().next();

        expect(result.value).toEqual(mockResponse.value);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v1.0/users");
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });
});

describe("MsgraphgroupsanduserClient — listGroupsByDisplayNameSearch", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET /v1.0/groups with search parameter", async () => {
        const mockResponse: ListGroupsByDisplayNameSearchResponse = {
            value: [{ id: "g-1", displayName: "Engineering" }],
        };
        mockFetchResponse(mockResponse);

        const client = new MsgraphgroupsanduserClient(TestConnectionUrl, createMockCredential());
        const result = await client.listGroupsByDisplayNameSearch(
            "true",
            "eventual",
            { search: "Engineering" },
        ).byPage().next();

        expect(result.value).toEqual(mockResponse.value);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v1.0/groups");
        expect(url).toContain("search=Engineering");
    });
});

describe("MsgraphgroupsanduserClient — getGroupProperties", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET group by ID", async () => {
        const mockResponse: GetGroupPropertiesResponse = {
            id: "group-123",
            displayName: "Reviewers",
        };
        mockFetchResponse(mockResponse);

        const client = new MsgraphgroupsanduserClient(TestConnectionUrl, createMockCredential());
        const result = await client.getGroupProperties("group-123");

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v1.0/groups/group-123");
    });
});

describe("MsgraphgroupsanduserClient — listDirectGroupMembers", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET members of a group", async () => {
        const mockResponse: ListDirectGroupMembersResponse = {
            value: [{ displayName: "Jane" }],
        };
        mockFetchResponse(mockResponse);

        const client = new MsgraphgroupsanduserClient(TestConnectionUrl, createMockCredential());
        const result = await client.listDirectGroupMembers(
            "group-1",
            "true",
            "eventual",
        ).byPage().next();

        expect(result.value).toEqual(mockResponse.value);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v1.0/groups/group-1/members");
    });
});

describe("MsgraphgroupsanduserClient — getMemberGroups", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to get member groups", async () => {
        const mockResponse: GetMemberGroupsResponse = {
            value: ["group-1", "group-2"],
        };
        mockFetchResponse(mockResponse);

        const client = new MsgraphgroupsanduserClient(TestConnectionUrl, createMockCredential());
        const input: GetMemberGroupsInput = { securityEnabledOnly: false };
        const result = await client.getMemberGroups(input, "user-123");

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v1.0/users/user-123/getMemberGroups");
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("MsgraphgroupsanduserClient — listSubscribedSkus", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET /v1.0/subscribedSkus", async () => {
        const mockResponse: ListSubscribedSkusResponse = {
            value: [{ skuPartNumber: "ENTERPRISEPACK" }],
        };
        mockFetchResponse(mockResponse);

        const client = new MsgraphgroupsanduserClient(TestConnectionUrl, createMockCredential());
        const result = await client.listSubscribedSkus().byPage().next();

        expect(result.value).toEqual(mockResponse.value);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v1.0/subscribedSkus");
    });
});

describe("MsgraphgroupsanduserClient — getMemberLicenseDetails", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET license details for a user", async () => {
        const mockResponse: GetMemberLicenseDetailsResponse = {
            value: [{ skuPartNumber: "ENTERPRISEPACK" }],
        };
        mockFetchResponse(mockResponse);

        const client = new MsgraphgroupsanduserClient(TestConnectionUrl, createMockCredential());
        const result = await client.getMemberLicenseDetails("user-1");

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/v1.0/users/user-1/licenseDetails");
    });
});

describe("MsgraphgroupsanduserClient — error handling", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw ConnectorError on non-OK response", async () => {
        mockFetchError(403, '{"error": "InsufficientPermissions"}');

        const client = new MsgraphgroupsanduserClient(TestConnectionUrl, createMockCredential());

        await expect(client.listUsers().byPage().next()).rejects.toThrow(ConnectorError);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "NotFound"}';
        mockFetchError(404, errorBody);

        const client = new MsgraphgroupsanduserClient(TestConnectionUrl, createMockCredential());

        try {
            await client.getGroupProperties("nonexistent-group");
            throw new Error("Expected ConnectorError to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorError);
            const connectorError = error as ConnectorError;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe(errorBody);
            expect(connectorError.operation).toBe("GetGroupProperties");
            expect(connectorError.request.url).toContain("nonexistent-group");
        }
    });
});

describe("Msgraphgroupsanduser — connector registry", () => {
    it("should have msgraphgroupsanduser in ConnectorNames", () => {
        expect(ConnectorNames.MSGraphGroupsAndUsers).toBe("msgraphgroupsanduser");
    });

    it("should include msgraphgroupsanduser in availableConnectors", () => {
        expect(availableConnectors).toContain("msgraphgroupsanduser");
    });
});
