// Copyright (c) Microsoft Corporation.  All rights reserved.

import { ConnectorClientOptions, DefaultConnectorClientOptions } from "../src/azure-workflows-connectors-sdk/options";

describe("ConnectorClientOptions", () => {
    it("should have sensible defaults", () => {
        expect(DefaultConnectorClientOptions.maxRetryAttempts).toBe(3);
        expect(DefaultConnectorClientOptions.timeoutMs).toBe(30000);
        expect(DefaultConnectorClientOptions.useExponentialBackoff).toBe(true);
        expect(DefaultConnectorClientOptions.initialRetryDelayMs).toBe(500);
    });

    it("should allow partial overrides", () => {
        const options: ConnectorClientOptions = {
            timeoutMs: 60000,
        };

        const merged = { ...DefaultConnectorClientOptions, ...options };
        expect(merged.timeoutMs).toBe(60000);
        expect(merged.maxRetryAttempts).toBe(3);
    });
});
