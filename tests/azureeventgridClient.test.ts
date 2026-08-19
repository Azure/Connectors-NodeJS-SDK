// Copyright (c) Microsoft Corporation.  All rights reserved.

import { AzureeventgridClient } from "../src/generated/AzureeventgridExtensions.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/azureeventgrid/abc123";

function createMockTokenProvider(): TokenProvider {
    return {
        getAccessTokenAsync: async () => "mock-bearer-token",
    };
}

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("AzureeventgridClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new AzureeventgridClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(AzureeventgridClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new AzureeventgridClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new AzureeventgridClient(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("AzureEventGrid — connector registry", () => {
    it("should expose AzureEventGrid in ConnectorNames", () => {
        expect(ConnectorNames.AzureEventGrid).toBe("azureeventgrid");
    });

    it("should include azureeventgrid in availableConnectors", () => {
        expect(availableConnectors).toContain("azureeventgrid");
    });
});
