// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import {
    availableConnectors, DataflowssmsClient, OnedriveClient,
    ServiceNowClient, UniversalprintClient,
} from "../src/generated/ManagedConnectors.ts";
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
        ["DataFlowsSMS", "dataflowssms", DataflowssmsClient],
        ["OneDrive", "onedrive", OnedriveClient],
        ["ServiceNow", "service-now", ServiceNowClient],
        ["UniversalPrint", "universalprint", UniversalprintClient],
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
        ["Dataflowssms", "DataflowssmsClient"],
        ["Onedrive", "OnedriveClient"],
        ["ServiceNow", "ServiceNowClient"],
        ["Universalprint", "UniversalprintClient"],
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
        const response = await new DataflowssmsClient(runtimeUrl, credential).sendSms({
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
        await expect(new DataflowssmsClient(runtimeUrl, credential).getBalance()).rejects.toMatchObject({
            statusCode: 400, connectorName: "dataflowssms",
        } satisfies Partial<ConnectorError>);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("double-encodes OneDrive opaque file IDs and preserves response fields", async () => {
        const fetch = mockResponse({ Id: "a/b", Name: "file.txt" });
        const response = await new OnedriveClient(runtimeUrl, credential).getFileMetadata("a/b");
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
        ["onedrive", () => new OnedriveClient(runtimeUrl, credential).getFileMetadata("missing")],
        ["service-now", () => new ServiceNowClient(runtimeUrl, credential).getRecord("incident", "missing")],
        ["universalprint", () => new UniversalprintClient(runtimeUrl, credential).printFile(
            "pdf", "printer", "report.pdf",
        )],
    ] as const)("propagates %s transport error status and body", async (api, invoke) => {
        const fetch = mockResponse({ error: "denied" }, 403);
        await expect(invoke()).rejects.toMatchObject({
            statusCode: 403, connectorName: api,
            responseBody: JSON.stringify({ error: "denied" }),
        } satisfies Partial<ConnectorError>);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("forwards a Universal Print PDF body and escaped configuration", async () => {
        const fetch = mockResponse(undefined, 204);
        await new UniversalprintClient(runtimeUrl, credential).printFile(
            "test pdf", "printer/a", "report A.pdf", { configurationCopies: 2 },
        );
        const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
        expect(init.method).toBe("POST");
        const params = new URL(url).searchParams;
        expect(params.get("printer")).toBe("printer/a");
        expect(params.get("fileName")).toBe("report A.pdf");
        expect(params.get("configuration_copies")).toBe("2");
        expect(init.body).toBeDefined();
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});
