// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    availableConnectors,
    ArmClient,
    AzureBlobClient,
    AzureMonitorLogsClient,
    BoxClient,
    DropboxClient,
    ExcelOnlineClient,
    FtpClient,
    GoogleCalendarClient,
    GoogleDriveClient,
    GoogleTasksClient,
    KustoClient,
    MqClient,
    MsGraphGroupsAndUsersClient,
    Office365Client,
    Office365GroupsMailClient,
    Office365UsersClient,
    OneDriveForBusinessClient,
    RssClient,
    SharePointOnlineClient,
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

    it("should contain exactly 103 connectors", () => {
        expect(availableConnectors).toHaveLength(103);
    });

    it("should include all ConnectorNames values", () => {
        for (const value of Object.values(ConnectorNames)) {
            expect(availableConnectors).toContain(value);
        }
    });

    it("should be sorted alphabetically by normalized API name", () => {
        const normalized = availableConnectors.map(apiName => apiName.replaceAll("-", ""));
        expect(normalized).toEqual([...normalized].sort());
    });
});

describe("ManagedConnectors — re-exports", () => {
    it("should re-export ArmClient", () => {
        expect(ArmClient).toBeDefined();
        expect(typeof ArmClient).toBe("function");
    });

    it("should re-export AzureBlobClient", () => {
        expect(AzureBlobClient).toBeDefined();
        expect(typeof AzureBlobClient).toBe("function");
    });

    it("should re-export AzureMonitorLogsClient", () => {
        expect(AzureMonitorLogsClient).toBeDefined();
        expect(typeof AzureMonitorLogsClient).toBe("function");
    });

    it("should re-export KustoClient", () => {
        expect(KustoClient).toBeDefined();
        expect(typeof KustoClient).toBe("function");
    });

    it("should re-export MqClient", () => {
        expect(MqClient).toBeDefined();
        expect(typeof MqClient).toBe("function");
    });

    it("should re-export MsGraphGroupsAndUsersClient", () => {
        expect(MsGraphGroupsAndUsersClient).toBeDefined();
        expect(typeof MsGraphGroupsAndUsersClient).toBe("function");
    });

    it("should re-export Office365Client", () => {
        expect(Office365Client).toBeDefined();
        expect(typeof Office365Client).toBe("function");
    });

    it("should re-export Office365UsersClient", () => {
        expect(Office365UsersClient).toBeDefined();
        expect(typeof Office365UsersClient).toBe("function");
    });

    it("should re-export OneDriveForBusinessClient", () => {
        expect(OneDriveForBusinessClient).toBeDefined();
        expect(typeof OneDriveForBusinessClient).toBe("function");
    });

    it("should re-export SharePointOnlineClient", () => {
        expect(SharePointOnlineClient).toBeDefined();
        expect(typeof SharePointOnlineClient).toBe("function");
    });

    it("should re-export SmtpClient", () => {
        expect(SmtpClient).toBeDefined();
        expect(typeof SmtpClient).toBe("function");
    });

    it("should re-export TeamsClient", () => {
        expect(TeamsClient).toBeDefined();
        expect(typeof TeamsClient).toBe("function");
    });

    it("should re-export BoxClient", () => {
        expect(BoxClient).toBeDefined();
        expect(typeof BoxClient).toBe("function");
    });

    it("should re-export DropboxClient", () => {
        expect(DropboxClient).toBeDefined();
        expect(typeof DropboxClient).toBe("function");
    });

    it("should re-export ExcelOnlineClient", () => {
        expect(ExcelOnlineClient).toBeDefined();
        expect(typeof ExcelOnlineClient).toBe("function");
    });

    it("should re-export FtpClient", () => {
        expect(FtpClient).toBeDefined();
        expect(typeof FtpClient).toBe("function");
    });

    it("should re-export GoogleCalendarClient", () => {
        expect(GoogleCalendarClient).toBeDefined();
        expect(typeof GoogleCalendarClient).toBe("function");
    });

    it("should re-export GoogleDriveClient", () => {
        expect(GoogleDriveClient).toBeDefined();
        expect(typeof GoogleDriveClient).toBe("function");
    });

    it("should re-export GoogleTasksClient", () => {
        expect(GoogleTasksClient).toBeDefined();
        expect(typeof GoogleTasksClient).toBe("function");
    });

    it("should re-export Office365GroupsMailClient", () => {
        expect(Office365GroupsMailClient).toBeDefined();
        expect(typeof Office365GroupsMailClient).toBe("function");
    });

    it("should re-export RssClient", () => {
        expect(RssClient).toBeDefined();
        expect(typeof RssClient).toBe("function");
    });
});
