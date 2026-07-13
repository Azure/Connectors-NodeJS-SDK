// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    availableConnectors,
    ArmClient,
    AzureblobClient,
    AzuremonitorlogsClient,
    KustoClient,
    MqClient,
    MsgraphgroupsanduserClient,
    Office365Client,
    Office365usersClient,
    OnedriveforbusinessClient,
    SharepointonlineClient,
    SmtpClient,
    TeamsClient,
} from "../src/generated/ManagedConnectors.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";

describe("availableConnectors", () => {
    it("should be an array of strings", () => {
        expect(Array.isArray(availableConnectors)).toBe(true);

        for (const name of availableConnectors) {
            expect(typeof name).toBe("string");
        }
    });

    it("should contain exactly 21 connectors", () => {
        expect(availableConnectors).toHaveLength(21);
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
    it("should re-export ArmClient", () => {
        expect(ArmClient).toBeDefined();
        expect(typeof ArmClient).toBe("function");
    });

    it("should re-export AzureblobClient", () => {
        expect(AzureblobClient).toBeDefined();
        expect(typeof AzureblobClient).toBe("function");
    });

    it("should re-export AzuremonitorlogsClient", () => {
        expect(AzuremonitorlogsClient).toBeDefined();
        expect(typeof AzuremonitorlogsClient).toBe("function");
    });

    it("should re-export KustoClient", () => {
        expect(KustoClient).toBeDefined();
        expect(typeof KustoClient).toBe("function");
    });

    it("should re-export MqClient", () => {
        expect(MqClient).toBeDefined();
        expect(typeof MqClient).toBe("function");
    });

    it("should re-export MsgraphgroupsanduserClient", () => {
        expect(MsgraphgroupsanduserClient).toBeDefined();
        expect(typeof MsgraphgroupsanduserClient).toBe("function");
    });

    it("should re-export Office365Client", () => {
        expect(Office365Client).toBeDefined();
        expect(typeof Office365Client).toBe("function");
    });

    it("should re-export Office365usersClient", () => {
        expect(Office365usersClient).toBeDefined();
        expect(typeof Office365usersClient).toBe("function");
    });

    it("should re-export OnedriveforbusinessClient", () => {
        expect(OnedriveforbusinessClient).toBeDefined();
        expect(typeof OnedriveforbusinessClient).toBe("function");
    });

    it("should re-export SharepointonlineClient", () => {
        expect(SharepointonlineClient).toBeDefined();
        expect(typeof SharepointonlineClient).toBe("function");
    });

    it("should re-export SmtpClient", () => {
        expect(SmtpClient).toBeDefined();
        expect(typeof SmtpClient).toBe("function");
    });

    it("should re-export TeamsClient", () => {
        expect(TeamsClient).toBeDefined();
        expect(typeof TeamsClient).toBe("function");
    });
});
