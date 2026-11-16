// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { AzureEventGridClient } from "../src/generated/AzureEventGridExtensions.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/azureeventgrid/abc123";

function createMockCredential(): TokenCredential {
    return {
        getToken: async () => ({ token: "mock-bearer-token", expiresOnTimestamp: Number.MAX_SAFE_INTEGER }),
    };
}

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("AzureEventGridClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new AzureEventGridClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(AzureEventGridClient);
    });

    it("should throw on null connection URL", () => {
        expect(() => new AzureEventGridClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new AzureEventGridClient(undefined as unknown as string, createMockCredential()))
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
