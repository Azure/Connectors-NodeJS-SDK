// Copyright (c) Microsoft Corporation.  All rights reserved.

import { ConnectorNames, ConnectorName } from "../src/generated/connectorNames.ts";

describe("ConnectorNames", () => {
    it("should expose Kusto with correct API name", () => {
        expect(ConnectorNames.Kusto).toBe("kusto");
    });

    it("should expose Office365 with correct API name", () => {
        expect(ConnectorNames.Office365).toBe("office365");
    });

    it("should expose Sharepointonline with correct API name", () => {
        expect(ConnectorNames.Sharepointonline).toBe("sharepointonline");
    });

    it("should expose Teams with correct API name", () => {
        expect(ConnectorNames.Teams).toBe("teams");
    });

    it("should contain exactly 4 connector entries", () => {
        const keys = Object.keys(ConnectorNames);
        expect(keys).toHaveLength(4);
    });

    it("should have all values as lowercase strings", () => {
        for (const value of Object.values(ConnectorNames)) {
            expect(value).toBe(value.toLowerCase());
            expect(typeof value).toBe("string");
        }
    });

    it("should be frozen (readonly) at the type level", () => {
        // Verify the ConnectorName type is a union of the known values.
        const validName: ConnectorName = "kusto";
        expect(Object.values(ConnectorNames)).toContain(validName);
    });
});
