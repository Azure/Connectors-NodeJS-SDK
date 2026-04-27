// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    availableConnectors,
    KustoClient,
    Office365Client,
    SharepointonlineClient,
    TeamsClient,
} from "../src/generated/ManagedConnectors";
import { ConnectorNames } from "../src/generated/connectorNames";

describe("availableConnectors", () => {
    it("should be an array of strings", () => {
        expect(Array.isArray(availableConnectors)).toBe(true);

        for (const name of availableConnectors) {
            expect(typeof name).toBe("string");
        }
    });

    it("should contain exactly 4 connectors", () => {
        expect(availableConnectors).toHaveLength(4);
    });

    it("should include all ConnectorNames values", () => {
        for (const value of Object.values(ConnectorNames)) {
            expect(availableConnectors).toContain(value);
        }
    });

    it("should be sorted alphabetically", () => {
        const sorted = [...availableConnectors].sort();
        expect(availableConnectors).toEqual(sorted);
    });
});

describe("ManagedConnectors — re-exports", () => {
    it("should re-export KustoClient", () => {
        expect(KustoClient).toBeDefined();
        expect(typeof KustoClient).toBe("function");
    });

    it("should re-export Office365Client", () => {
        expect(Office365Client).toBeDefined();
        expect(typeof Office365Client).toBe("function");
    });

    it("should re-export SharepointonlineClient", () => {
        expect(SharepointonlineClient).toBeDefined();
        expect(typeof SharepointonlineClient).toBe("function");
    });

    it("should re-export TeamsClient", () => {
        expect(TeamsClient).toBeDefined();
        expect(typeof TeamsClient).toBe("function");
    });
});
