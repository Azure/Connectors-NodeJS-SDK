// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { ConnectorClientBase } from "../src/azureConnectors/clientBase.ts";
import type { ConnectorClientOptions } from "../src/azureConnectors/options.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

function createMockCredential(): TokenCredential {
    return {
        getToken: async () => ({ token: "mock-bearer-token", expiresOnTimestamp: Number.MAX_SAFE_INTEGER }),
    };
}

/**
 * Concrete subclass that exposes resolveUrl for testing.
 */
class TestConnectorClient extends ConnectorClientBase {
    public get connectorName(): string {
        return "TestConnector";
    }

    public testResolveUrl(path: string): string {
        return this.resolveUrl(path);
    }
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe("ConnectorClientBase", () => {
    describe("constructor", () => {
        it("should strip trailing slashes from connectionRuntimeUrl", () => {
            const client = new TestConnectorClient(
                "https://proxy.azure-apihub.net/apim/arm/conn123///",
                createMockCredential(),
            );

            const result = client.testResolveUrl("/subscriptions");
            expect(result).toBe("https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions");
        });

        it("should throw when credential is null", () => {
            expect(() => new TestConnectorClient("https://example.com", null as unknown as TokenCredential))
            .toThrow("credential cannot be null or undefined.");
        });

        it("should throw when connectionRuntimeUrl is null", () => {
            expect(() => new TestConnectorClient(null as unknown as string, createMockCredential()))
                .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
        });

        it("should throw when connectionRuntimeUrl is undefined", () => {
            expect(() => new TestConnectorClient(undefined as unknown as string, createMockCredential()))
                .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
        });

        it("should accept empty string connectionRuntimeUrl", () => {
            expect(() => new TestConnectorClient("", createMockCredential())).not.toThrow();
        });
    });

    describe("resolveUrl", () => {
        const baseUrl = "https://proxy.azure-apihub.net/apim/arm/conn123";

        it("should resolve relative path by prepending connectionRuntimeUrl", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testResolveUrl("/subscriptions");

            expect(result).toBe("https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions");
        });

        it("should resolve relative path with query string", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testResolveUrl("/subscriptions?page=2&size=10");

            expect(result).toBe("https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions?page=2&size=10");
        });

        it("should pass through absolute URL with same host, scheme, and port", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testResolveUrl(
                "https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions?page=2",
            );

            expect(result).toBe("https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions?page=2");
        });

        it("should rewrite foreign host URL through connection runtime URL", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testResolveUrl(
                "https://management.azure.com/subscriptions/sub-id/resourceGroups?$skiptoken=abc",
            );

            expect(result).toBe(
                "https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions/sub-id/resourceGroups?$skiptoken=abc",
            );
        });

        it("should reject same host with different scheme (http vs https)", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            expect(() => client.testResolveUrl(
                "http://proxy.azure-apihub.net/apim/arm/conn123/subscriptions",
            )).toThrow("Refusing to send credentials to a potentially insecure endpoint.");
        });

        it("should reject same host with different port", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            expect(() => client.testResolveUrl(
                "https://proxy.azure-apihub.net:8443/apim/arm/conn123/subscriptions",
            )).toThrow("Refusing to send credentials to a potentially insecure endpoint.");
        });

        it("should throw for absolute URL when connectionRuntimeUrl is empty", () => {
            const client = new TestConnectorClient("", createMockCredential());

            expect(() => client.testResolveUrl(
                "https://management.azure.com/subscriptions",
            )).toThrow("Cannot validate absolute NextLink URL because no connection runtime URL was configured.");
        });

        it("should throw for relative path when connectionRuntimeUrl is empty", () => {
            const client = new TestConnectorClient("", createMockCredential());

            expect(() => client.testResolveUrl("/subscriptions"))
                .toThrow("Cannot resolve relative path because no connection runtime URL was configured.");
        });

        it("should handle foreign host URL with path only (no query string)", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testResolveUrl("https://management.azure.com/subscriptions");

            expect(result).toBe("https://proxy.azure-apihub.net/apim/arm/conn123/subscriptions");
        });

        it("should perform case-insensitive host comparison", () => {
            const client = new TestConnectorClient(baseUrl, createMockCredential());

            const result = client.testResolveUrl(
                "https://PROXY.AZURE-APIHUB.NET/apim/arm/conn123/subscriptions?page=2",
            );

            expect(result).toBe("https://PROXY.AZURE-APIHUB.NET/apim/arm/conn123/subscriptions?page=2");
        });
    });
});
