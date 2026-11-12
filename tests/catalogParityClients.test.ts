// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import {
    availableConnectors, DataFlowsSmsClient, OneDriveClient,
    ServiceNowClient, UniversalPrintClient,
} from "../src/generated/ManagedConnectors.ts";
import { DataFlowsSmsTriggerOperations } from "../src/generated/DataFlowsSmsExtensions.ts";
import type { AIInsightResponse, AIInsightCollectionResponse } from "../src/generated/TeamsExtensions.ts";
import { OneDriveTriggerOperations, OneDriveTriggerParameters } from "../src/generated/OneDriveExtensions.ts";
import * as generated from "../src/generated/index.ts";
import * as fs from "node:fs";
import { execFileSync } from "node:child_process";

const runtimeUrl = "https://connection-runtime.example.test/connections/test";
const credential: TokenCredential = {
    getToken: async () => ({ token: "mock-token", expiresOnTimestamp: Number.MAX_SAFE_INTEGER }),
};
const originalFetch = global.fetch;

function mockResponse(body: unknown, status = 200): jest.Mock {
    const fetch = jest.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        text: async () => body === undefined ? "" : JSON.stringify(body),
        headers: new Headers(),
    } as Response);
    global.fetch = fetch;
    return fetch;
}

afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
});

describe("new catalog clients", () => {
    it.each([
        ["DataFlowsSms", "dataflowssms", DataFlowsSmsClient],
        ["OneDrive", "onedrive", OneDriveClient],
        ["ServiceNow", "service-now", ServiceNowClient],
        ["UniversalPrint", "universalprint", UniversalPrintClient],
    ] as const)("exports %s in every public catalog surface", (name, api, clientType) => {
        expect(ConnectorNames[name]).toBe(api);
        expect(availableConnectors).toContain(api);
        expect(generated[`${clientType.name}` as keyof typeof generated]).toBe(clientType);
        expect(new clientType(runtimeUrl, credential).connectorName).toBe(api);
        const packageManifest = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
            exports: Record<string, unknown>;
        };
        expect(packageManifest.exports["./generated/*"]).toBeDefined();
    });

    it.each([
        ["DataFlowsSms", "DataFlowsSmsClient"],
        ["OneDrive", "OneDriveClient"],
        ["ServiceNow", "ServiceNowClient"],
        ["UniversalPrint", "UniversalPrintClient"],
    ])("resolves %s from ESM and CommonJS package subpath exports", (moduleName, clientName) => {
        const specifier = `@azure/connectors/generated/${moduleName}Extensions`;
        const esm = execFileSync(process.execPath, ["--input-type=module", "-e",
            `import { ${clientName} } from "${specifier}"; process.stdout.write(${clientName}.name);`,
        ], { cwd: process.cwd(), encoding: "utf8" });
        const cjs = execFileSync(process.execPath, ["-e",
            `const { ${clientName} } = require("${specifier}"); process.stdout.write(${clientName}.name);`,
        ], { cwd: process.cwd(), encoding: "utf8" });
        expect(esm).toBe(clientName);
        expect(cjs).toBe(clientName);
    });

    it("keeps all 103 manifest APIs in both registries without duplicates", () => {
        const manifest = JSON.parse(fs.readFileSync("generation.manifest.json", "utf8")) as {
            connectors: Array<{ apiName: string }>;
        };
        const apiIds = manifest.connectors.map(connector => connector.apiName).sort();
        expect(apiIds).toHaveLength(103);
        expect(new Set(apiIds).size).toBe(103);
        expect([...availableConnectors].sort()).toEqual(apiIds);
        expect(Object.values(ConnectorNames).sort()).toEqual(apiIds);
    });

    it("serializes DataFlows SMS request and returns typed response", async () => {
        const fetch = mockResponse({ status: "accepted" });
        const response = await new DataFlowsSmsClient(runtimeUrl, credential).sendSms({
            recipient: "+12065550123", sender_id: "Notify", message: "hello", type: "sms",
        });
        expect(response).toEqual({ status: "accepted" });
        const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
        expect(url).toBe(`${runtimeUrl}/sms/send`);
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body as string)).toEqual({
            recipient: "+12065550123", sender_id: "Notify", message: "hello", type: "sms",
        });
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("propagates DataFlows SMS HTTP errors instead of returning a payload", async () => {
        const fetch = mockResponse({ error: "invalid" }, 400);
        await expect(new DataFlowsSmsClient(runtimeUrl, credential).getBalance()).rejects.toMatchObject({
            statusCode: 400, connectorName: "dataflowssms",
        } satisfies Partial<ConnectorError>);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("double-encodes OneDrive opaque file IDs and preserves response fields", async () => {
        const fetch = mockResponse({ Id: "a/b", Name: "file.txt" });
        const response = await new OneDriveClient(runtimeUrl, credential).getFileMetadata("a/b");
        expect(response).toEqual({ Id: "a/b", Name: "file.txt" });
        const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
        expect(url).toContain("a%252Fb");
        expect(init.method).toBe("GET");
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("encodes ServiceNow record path and Boolean query values", async () => {
        const fetch = mockResponse({ result: { sys_id: "a/b" } });
        const response = await new ServiceNowClient(runtimeUrl, credential).getRecord(
            "incident/urgent", "a/b", { sysparmDisplayValue: true },
        );
        expect(response).toEqual({ result: { sys_id: "a/b" } });
        const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
        expect(new URL(url).pathname).toContain("/table/incident%2Furgent/a%2Fb");
        expect(new URL(url).searchParams.get("sysparm_display_value")).toBe("true");
        expect(init.method).toBe("GET");
    });

    it.each([
        ["onedrive", () => new OneDriveClient(runtimeUrl, credential).getFileMetadata("missing")],
        ["service-now", () => new ServiceNowClient(runtimeUrl, credential).getRecord("incident", "missing")],
        ["universalprint", () => new UniversalPrintClient(runtimeUrl, credential).printFile(
            new Blob(["pdf"]), "printer", "report.pdf",
        )],
    ] as const)("propagates %s transport error status and body", async (api, invoke) => {
        const fetch = mockResponse({ error: "denied" }, 403);
        await expect(invoke()).rejects.toMatchObject({
            statusCode: 403, connectorName: api,
            responseBody: JSON.stringify({ error: "denied" }),
        } satisfies Partial<ConnectorError>);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("uses octet-stream for a raw Blob without an authored media type", async () => {
        const bytes = new Uint8Array([0x00, 0x80, 0xff]);
        const fetch = mockResponse(undefined, 204);
        await new UniversalPrintClient(runtimeUrl, credential).printFile(new Blob([bytes]), "printer", "file.pdf");
        const [, init] = fetch.mock.calls[0] as [string, RequestInit];
        expect(new Headers(init.headers).get("Content-Type")).toBe("application/octet-stream");
        expect(new Uint8Array(await new Response(init.body).arrayBuffer())).toEqual(bytes);
    });

    it("forwards a Universal Print PDF body and escaped configuration", async () => {
        const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00, 0xff]);
        const fetch = mockResponse(undefined, 204);
        await new UniversalPrintClient(runtimeUrl, credential).printFile(
            new Blob([bytes], { type: "application/pdf" }), "printer/a", "report A.pdf", { configurationCopies: 2 },
        );
        const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
        expect(init.method).toBe("POST");
        const params = new URL(url).searchParams;
        expect(params.get("printer")).toBe("printer/a");
        expect(params.get("fileName")).toBe("report A.pdf");
        expect(params.get("configuration_copies")).toBe("2");
        expect(new Headers(init.headers).get("Content-Type")).toBe("application/pdf");
        expect(new Uint8Array(await new Response(init.body).arrayBuffer())).toEqual(bytes);
        expect(fetch).toHaveBeenCalledTimes(1);
    });
    it.each([{ rows: [] }, { rows: [{ Id: "root", Name: "folder" }] }])("reads root folder items without an envelope: %j", async ({ rows }) => {
        const fetch = mockResponse(rows);
        const folders = new OneDriveClient(runtimeUrl, credential).listRootFolder();
        expect(fetch).not.toHaveBeenCalled();
        const actual = [];
        for await (const folder of folders) actual.push(folder);
        expect(actual).toEqual(rows);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch.mock.calls[0][0]).toBe(runtimeUrl + "/datasets/default/folders");
        expect(fetch.mock.calls[0][1].method).toBe("GET");
    });

    it.each([{ rows: [] }, { rows: [{ sys_id: "record", active: false }] }])("reads ServiceNow result items without metadata: %j", async ({ rows }) => {
        const fetch = mockResponse({ result: rows });
        const records = new ServiceNowClient(runtimeUrl, credential).getRecords("incident/urgent", { sysparmLimit: 2 });
        expect(fetch).not.toHaveBeenCalled();
        const actual = [];
        for await (const record of records) actual.push(record);
        expect(actual).toEqual(rows);
        expect(fetch).toHaveBeenCalledTimes(1);
        const url = new URL(fetch.mock.calls[0][0]);
        expect(url.pathname).toBe("/connections/test/api/now/v2/table/incident%2Furgent");
        expect(url.searchParams.get("sysparm_limit")).toBe("2");
    });

    it("follows OneDrive continuation after an empty initial page and terminates", async () => {
        const secondUrl = runtimeUrl + "/datasets/default/foldersV2/folder%252Fid?skipToken=second";
        const thirdUrl = runtimeUrl + "/datasets/default/foldersV2/folder%252Fid?skipToken=third";
        const pages = [{ value: [], nextLink: secondUrl }, { value: [{ Id: "later", Name: "file.txt" }], nextLink: thirdUrl }, { value: [] }];
        const fetch = mockResponse(undefined);
        let pageIndex = 0;
        fetch.mockImplementation(async () => {
            const page = pages[pageIndex++];
            if (page === undefined) throw new Error("Unexpected request after final page.");
            return new Response(JSON.stringify(page), { status: 200 });
        });
        const files = new OneDriveClient(runtimeUrl, credential).listFolder("folder/id", { top: 2 });
        expect(fetch).not.toHaveBeenCalled();
        const actual = [];
        for await (const file of files) actual.push(file);
        expect(actual).toEqual([{ Id: "later", Name: "file.txt" }]);
        expect(fetch.mock.calls.map(call => call[0])).toEqual([runtimeUrl + "/datasets/default/foldersV2/folder%252Fid?top=2", secondUrl, thirdUrl]);
        expect(fetch.mock.calls.every(call => call[1].method === "GET")).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("preserves trigger IDs and actual OneDrive parameter metadata", () => {
        expect(DataFlowsSmsTriggerOperations).toEqual({ OnRegisterWebhook: "RegisterWebhook" });
        expect(OneDriveTriggerOperations).toEqual({ OnDeletedFiles: "OnDeletedFiles", OnNewFile: "OnNewFileV2", OnNewFiles: "OnNewFilesV2", OnUpdatedFile: "OnUpdatedFileV2", OnUpdatedFiles: "OnUpdatedFilesV2" });
        expect(OneDriveTriggerParameters.OnNewFile.folderId).toMatchObject({ name: "folderId", type: "string", required: true });
        expect(OneDriveTriggerParameters.OnNewFile.includeSubfolders).toMatchObject({ name: "includeSubfolders", type: "boolean", required: false, defaultValue: "false" });
        expect(OneDriveTriggerParameters.OnNewFile.inferContentType).toMatchObject({ name: "inferContentType", type: "boolean", required: false, defaultValue: "true" });
    });

    it("forwards a OneDrive root Blob without JSON serialization", async () => {
        const bytes = new Uint8Array([0x00, 0xff, 0x80]);
        const fetch = mockResponse({ Id: "uploaded" });
        await new OneDriveClient(runtimeUrl, credential).createFile(new Blob([bytes], { type: "application/pdf" }), "/folder", "file.pdf");
        const [, init] = fetch.mock.calls[0] as [string, RequestInit];
        expect(new Uint8Array(await new Response(init.body).arrayBuffer())).toEqual(bytes);
        expect(new Headers(init.headers).get("Content-Type")).toBe("application/pdf");
        expect(init.method).toBe("POST");
    });

    it.each([
        ["commondataservice", "CommonDataService"],
        ["dataflowssms", "DataFlowsSms"],
        ["documentdb", "DocumentDB"],
        ["docusign", "Docusign"],
        ["freshservice", "Freshservice"],
        ["jedoxodatahub", "JedoxODataHub"],
        ["mailchimp", "Mailchimp"],
        ["mq", "MQ"],
        ["msgraphgroupsanduser", "MSGraphGroupsAndUsers"],
        ["revai", "RevAI"],
        ["servicebus", "ServiceBus"],
        ["starrezrestv1", "StarRezRestV1"],
        ["zeptomail", "ZeptoMail"],
    ] as const)("keeps %s bound to its canonical %s module and class", (apiName, prefix) => {
        const moduleFile = `${prefix}Extensions.ts`;
        expect(fs.readdirSync("src/generated")).toContain(moduleFile);
        const Client = generated[`${prefix}Client` as keyof typeof generated] as typeof DataFlowsSmsClient;
        expect(Client.name).toBe(`${prefix}Client`);
        expect(new Client(runtimeUrl, credential).connectorName).toBe(apiName);
    });

    it("keeps Teams AI insight type-only renames independent of JSON field names", () => {
        const insight: AIInsightResponse = { id: "insight-1", contentCorrelationId: "correlation-1" };
        const collection: AIInsightCollectionResponse = { value: [insight] };
        expect(JSON.stringify(collection)).toBe('{"value":[{"id":"insight-1","contentCorrelationId":"correlation-1"}]}');
    });

});
