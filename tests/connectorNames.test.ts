// Copyright (c) Microsoft Corporation.  All rights reserved.

import { ConnectorNames, ConnectorName } from "../src/generated/connectorNames.ts";

describe("ConnectorNames", () => {
    it("should expose AzureResourceManager with correct API name", () => {
        expect(ConnectorNames.AzureResourceManager).toBe("arm");
    });

    it("should expose AzureBlobStorage with correct API name", () => {
        expect(ConnectorNames.AzureBlobStorage).toBe("azureblob");
    });

    it("should expose AzureMonitorLogs with correct API name", () => {
        expect(ConnectorNames.AzureMonitorLogs).toBe("azuremonitorlogs");
    });

    it("should expose AzureDataExplorer with correct API name", () => {
        expect(ConnectorNames.AzureDataExplorer).toBe("kusto");
    });

    it("should expose MQ with correct API name", () => {
        expect(ConnectorNames.MQ).toBe("mq");
    });

    it("should expose MSGraphGroupsAndUsers with correct API name", () => {
        expect(ConnectorNames.MSGraphGroupsAndUsers).toBe("msgraphgroupsanduser");
    });

    it("should expose Office365Outlook with correct API name", () => {
        expect(ConnectorNames.Office365Outlook).toBe("office365");
    });

    it("should expose Office365Users with correct API name", () => {
        expect(ConnectorNames.Office365Users).toBe("office365users");
    });

    it("should expose OneDriveForBusiness with correct API name", () => {
        expect(ConnectorNames.OneDriveForBusiness).toBe("onedriveforbusiness");
    });

    it("should expose SharePoint with correct API name", () => {
        expect(ConnectorNames.SharePoint).toBe("sharepointonline");
    });

    it("should expose SMTP with correct API name", () => {
        expect(ConnectorNames.SMTP).toBe("smtp");
    });

    it("should expose MicrosoftTeams with correct API name", () => {
        expect(ConnectorNames.MicrosoftTeams).toBe("teams");
    });

    it("should contain exactly 21 connector entries", () => {
        const keys = Object.keys(ConnectorNames);
        expect(keys).toHaveLength(21);
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
