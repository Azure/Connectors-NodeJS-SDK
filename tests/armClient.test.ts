// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    ArmClient,
    Deployment,
    DeploymentExtended,
    DeploymentValidateResult,
    DeploymentExportResult,
    DeploymentListResult,
    DeploymentOperationsListResult,
    ExportTemplateRequest,
    LocationListResult,
    Provider,
    ProviderListResult,
    ResourceGroup,
    ResourceGroupListResult,
    ResourceGroupExportResult,
    ResourceListResult,
    Subscription,
    SubscriptionListResult,
} from "../src/generated/ArmExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/arm/abc123";
const TestSubscriptionId = "sub-12345";
const TestResourceGroupName = "rg-test";

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

const _subscription: Subscription = {
    id: "/subscriptions/sub-1",
    subscriptionId: "sub-1",
    displayName: "My Subscription",
};

const _resourceGroup: ResourceGroup = {
    location: "eastus",
    name: "my-rg",
};

const _deployment: Deployment = {
    properties: {
        mode: "Incremental",
    },
};

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("ArmClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new ArmClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(ArmClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new ArmClient(TestConnectionUrl + "///", createMockTokenProvider());
        expect(client).toBeDefined();
    });
});

describe("ArmClient — subscriptionsListAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET /subscriptions", async () => {
        const mockResponse: SubscriptionListResult = {
            value: [{ subscriptionId: "sub-1", displayName: "Test Sub" }],
        };
        mockFetchResponse(mockResponse);

        const client = new ArmClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.subscriptionsListAsync(TestSubscriptionId);

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/subscriptions");
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });
});

describe("ArmClient — subscriptionsGetAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET subscription by ID", async () => {
        const mockSubscription: Subscription = {
            subscriptionId: TestSubscriptionId,
            displayName: "My Sub",
        };
        mockFetchResponse(mockSubscription);

        const client = new ArmClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.subscriptionsGetAsync(TestSubscriptionId);

        expect(result).toEqual(mockSubscription);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain(`/subscriptions/${TestSubscriptionId}`);
    });
});

describe("ArmClient — subscriptionsListLocationsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET locations for subscription", async () => {
        const mockLocations: LocationListResult = {
            value: [{ name: "eastus", displayName: "East US" }],
        };
        mockFetchResponse(mockLocations);

        const client = new ArmClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.subscriptionsListLocationsAsync(TestSubscriptionId);

        expect(result).toEqual(mockLocations);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain(`/subscriptions/${TestSubscriptionId}/locations`);
    });
});

describe("ArmClient — resourceGroupsListAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET resource groups", async () => {
        const mockResponse: ResourceGroupListResult = {
            value: [{ name: "rg-1", location: "eastus" }],
        };
        mockFetchResponse(mockResponse);

        const client = new ArmClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.resourceGroupsListAsync(TestSubscriptionId);

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/resourcegroups");
        expect(init.method).toBe("GET");
    });
});

describe("ArmClient — resourceGroupsGetAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET a specific resource group", async () => {
        const mockGroup: ResourceGroup = { name: TestResourceGroupName, location: "westus2" };
        mockFetchResponse(mockGroup);

        const client = new ArmClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.resourceGroupsGetAsync(TestSubscriptionId, TestResourceGroupName);

        expect(result).toEqual(mockGroup);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain(`/resourcegroups/${TestResourceGroupName}`);
    });
});

describe("ArmClient — resourceGroupsCreateOrUpdateAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should PUT resource group with body", async () => {
        const input: ResourceGroup = { location: "eastus" };
        const mockResponse: ResourceGroup = { name: TestResourceGroupName, location: "eastus" };
        mockFetchResponse(mockResponse);

        const client = new ArmClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.resourceGroupsCreateOrUpdateAsync(
            input,
            TestSubscriptionId,
            TestResourceGroupName,
        );

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain(`/resourcegroups/${TestResourceGroupName}`);
        expect(init.method).toBe("PUT");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("ArmClient — resourceGroupsDeleteAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should send DELETE request", async () => {
        mockFetchResponse(null);

        const client = new ArmClient(TestConnectionUrl, createMockTokenProvider());
        await client.resourceGroupsDeleteAsync(TestSubscriptionId, TestResourceGroupName);

        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("DELETE");
    });
});

describe("ArmClient — deploymentsCreateOrUpdateAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should PUT deployment with body", async () => {
        const input: Deployment = { properties: { mode: "Incremental" } };
        const mockResponse: DeploymentExtended = { name: "deploy-1" };
        mockFetchResponse(mockResponse);

        const client = new ArmClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.deploymentsCreateOrUpdateAsync(
            input,
            TestSubscriptionId,
            TestResourceGroupName,
            "deploy-1",
        );

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/deployments/deploy-1");
        expect(init.method).toBe("PUT");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("ArmClient — deploymentsGetAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET specific deployment", async () => {
        const mockDeployment: DeploymentExtended = { name: "deploy-1" };
        mockFetchResponse(mockDeployment);

        const client = new ArmClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.deploymentsGetAsync(
            TestSubscriptionId,
            TestResourceGroupName,
            "deploy-1",
        );

        expect(result).toEqual(mockDeployment);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/deployments/deploy-1");
    });
});

describe("ArmClient — providersListAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET providers for subscription", async () => {
        const mockResponse: ProviderListResult = {
            value: [{ namespace: "Microsoft.Compute" }],
        };
        mockFetchResponse(mockResponse);

        const client = new ArmClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.providersListAsync(TestSubscriptionId);

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/providers");
    });
});

describe("ArmClient — error handling", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(403, '{"error": "Forbidden"}');

        const client = new ArmClient(TestConnectionUrl, createMockTokenProvider());

        await expect(
            client.subscriptionsListAsync(TestSubscriptionId),
        ).rejects.toThrow(ConnectorException);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "NotFound"}';
        mockFetchError(404, errorBody);

        const client = new ArmClient(TestConnectionUrl, createMockTokenProvider());

        try {
            await client.subscriptionsGetAsync(TestSubscriptionId);
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

describe("Arm — connector registry", () => {
    it("should have arm in ConnectorNames", () => {
        expect(ConnectorNames.Arm).toBe("arm");
    });

    it("should include arm in availableConnectors", () => {
        expect(availableConnectors).toContain("arm");
    });
});
