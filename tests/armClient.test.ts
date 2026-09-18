// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
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
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/arm/abc123";
const TestSubscriptionId = "sub-12345";
const TestResourceGroupName = "rg-test";
const TestApiVersion = "2021-04-01";

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
        const client = new ArmClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(ArmClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new ArmClient(TestConnectionUrl + "///", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should construct with an empty connection URL", () => {
        const client = new ArmClient("", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should throw on null connection URL", () => {
        expect(() => new ArmClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new ArmClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("ArmClient — listSubscriptions", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET /subscriptions", async () => {
        const mockResponse: SubscriptionListResult = {
            value: [{ subscriptionId: "sub-1", displayName: "Test Sub" }],
        };
        mockFetchResponse(mockResponse);

        const client = new ArmClient(TestConnectionUrl, createMockCredential());
        const result = await client.listSubscriptions(TestApiVersion).byPage().next();

        expect(result.value).toEqual(mockResponse.value);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/subscriptions");
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });
});

describe("ArmClient — getSubscription", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET subscription by ID", async () => {
        const mockSubscription: Subscription = {
            subscriptionId: TestSubscriptionId,
            displayName: "My Sub",
        };
        mockFetchResponse(mockSubscription);

        const client = new ArmClient(TestConnectionUrl, createMockCredential());
        const result = await client.getSubscription(TestSubscriptionId, TestApiVersion);

        expect(result).toEqual(mockSubscription);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain(`/subscriptions/${TestSubscriptionId}`);
    });
});

describe("ArmClient — listSubscriptionsLocations", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET locations for subscription", async () => {
        const mockLocations: LocationListResult = {
            value: [{ name: "eastus", displayName: "East US" }],
        };
        mockFetchResponse(mockLocations);

        const client = new ArmClient(TestConnectionUrl, createMockCredential());
        const result = await client.listSubscriptionsLocations(TestSubscriptionId, TestApiVersion).byPage().next();

        expect(result.value).toEqual(mockLocations.value);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain(`/subscriptions/${TestSubscriptionId}/locations`);
    });
});

describe("ArmClient — listResourceGroups", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET resource groups", async () => {
        const mockResponse: ResourceGroupListResult = {
            value: [{ name: "rg-1", location: "eastus" }],
        };
        mockFetchResponse(mockResponse);

        const client = new ArmClient(TestConnectionUrl, createMockCredential());
        const result = await client.listResourceGroups(TestSubscriptionId, TestApiVersion).byPage().next();

        expect(result.value).toEqual(mockResponse.value);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/resourcegroups");
        expect(init.method).toBe("GET");
    });
});

describe("ArmClient — getResourceGroup", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET a specific resource group", async () => {
        const mockGroup: ResourceGroup = { name: TestResourceGroupName, location: "westus2" };
        mockFetchResponse(mockGroup);

        const client = new ArmClient(TestConnectionUrl, createMockCredential());
        const result = await client.getResourceGroup(TestSubscriptionId, TestResourceGroupName, TestApiVersion);

        expect(result).toEqual(mockGroup);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain(`/resourcegroups/${TestResourceGroupName}`);
    });
});

describe("ArmClient — upsertResourceGroup", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should PUT resource group with body", async () => {
        const input: ResourceGroup = { location: "eastus" };
        const mockResponse: ResourceGroup = { name: TestResourceGroupName, location: "eastus" };
        mockFetchResponse(mockResponse);

        const client = new ArmClient(TestConnectionUrl, createMockCredential());
        const result = await client.upsertResourceGroup(
            input,
            TestSubscriptionId,
            TestResourceGroupName,
            TestApiVersion,
        );

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain(`/resourcegroups/${TestResourceGroupName}`);
        expect(init.method).toBe("PUT");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("ArmClient — deleteResourceGroup", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should send DELETE request", async () => {
        mockFetchResponse(null);

        const client = new ArmClient(TestConnectionUrl, createMockCredential());
        await client.deleteResourceGroup(TestSubscriptionId, TestResourceGroupName, TestApiVersion);

        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("DELETE");
    });
});

describe("ArmClient — upsertDeployment", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should PUT deployment with body", async () => {
        const input: Deployment = { properties: { mode: "Incremental" } };
        const mockResponse: DeploymentExtended = { name: "deploy-1" };
        mockFetchResponse(mockResponse);

        const client = new ArmClient(TestConnectionUrl, createMockCredential());
        const result = await client.upsertDeployment(
            input,
            TestSubscriptionId,
            TestResourceGroupName,
            "deploy-1",
            TestApiVersion,
        );

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/deployments/deploy-1");
        expect(init.method).toBe("PUT");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("ArmClient — getDeployment", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET specific deployment", async () => {
        const mockDeployment: DeploymentExtended = { name: "deploy-1" };
        mockFetchResponse(mockDeployment);

        const client = new ArmClient(TestConnectionUrl, createMockCredential());
        const result = await client.getDeployment(
            TestSubscriptionId,
            TestResourceGroupName,
            "deploy-1",
            TestApiVersion,
        );

        expect(result).toEqual(mockDeployment);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/deployments/deploy-1");
    });
});

describe("ArmClient — listProviders", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET providers for subscription", async () => {
        const mockResponse: ProviderListResult = {
            value: [{ namespace: "Microsoft.Compute" }],
        };
        mockFetchResponse(mockResponse);

        const client = new ArmClient(TestConnectionUrl, createMockCredential());
        const result = await client.listProviders(TestSubscriptionId, TestApiVersion).byPage().next();

        expect(result.value).toEqual(mockResponse.value);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/providers");
    });
});

describe("ArmClient — error handling", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw ConnectorError on non-OK response", async () => {
        mockFetchError(403, '{"error": "Forbidden"}');

        const client = new ArmClient(TestConnectionUrl, createMockCredential());

        await expect(
            client.listSubscriptions(TestApiVersion).byPage().next(),
        ).rejects.toThrow(ConnectorError);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "NotFound"}';
        mockFetchError(404, errorBody);

        const client = new ArmClient(TestConnectionUrl, createMockCredential());

        try {
            await client.getSubscription(TestSubscriptionId, TestApiVersion);
            throw new Error("Expected ConnectorError to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorError);
            const connectorError = error as ConnectorError;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe(errorBody);
            expect(connectorError.operation).toBe("Subscriptions_Get");
            expect(connectorError.request.url).toContain(`/subscriptions/${TestSubscriptionId}`);
        }
    });
});

describe("Arm — connector registry", () => {
    it("should have arm in ConnectorNames", () => {
        expect(ConnectorNames.AzureResourceManager).toBe("arm");
    });

    it("should include arm in availableConnectors", () => {
        expect(availableConnectors).toContain("arm");
    });
});
