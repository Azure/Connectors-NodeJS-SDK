// Copyright (c) Microsoft Corporation.  All rights reserved.

import { execFileSync } from "node:child_process";

const multipartProbe = String.raw`
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHttpHeaders } from "@azure/core-rest-pipeline";

const [distribution, fileName] = process.argv.slice(1);
const modulePath = resolve("dist", distribution, "generated", "DocuwareExtensions.js");
const { DocuwareClient } = distribution === "cjs"
    ? createRequire(import.meta.url)(modulePath)
    : await import(pathToFileURL(modulePath).href);
const content = new Uint8Array([0, 127, 128, 255, 13, 10]);
let requestCount = 0;
const requestedScopes = [];
const credential = {
    async getToken(scopes) {
        requestedScopes.push(scopes);
        return { token: "multipart-test-token", expiresOnTimestamp: Number.MAX_SAFE_INTEGER };
    },
};
const httpClient = {
    async sendRequest(request) {
        requestCount++;
        assert.equal(request.method, "POST");
        assert.equal(request.headers.get("Authorization"), "Bearer multipart-test-token");
        assert.match(request.url, /\/FileCabinets\/cabinet\/Documents\?StoreDialogId=dialog$/);
        const body = typeof request.body === "function" ? request.body() : request.body;
        const chunks = [];
        if (body instanceof Blob) {
            chunks.push(new Uint8Array(await body.arrayBuffer()));
        } else {
            for await (const chunk of body) {
                chunks.push(Buffer.from(chunk));
            }
        }
        const received = await new Response(Buffer.concat(chunks), {
            headers: { "Content-Type": request.headers.get("Content-Type") },
        }).formData();
        const file = received.get("file");
        assert.ok(file instanceof File);
        assert.equal(file.name, fileName);
        assert.equal(file.type, "application/custom");
        assert.deepEqual(new Uint8Array(await file.arrayBuffer()), content);
        assert.equal(received.get("index"), "invoice metadata");
        assert.equal(received.get("Default"), "{}");
        assert.equal([...received.keys()].length, 3);
        return {
            request,
            status: 200,
            headers: createHttpHeaders(),
            bodyAsText: JSON.stringify({ DocumentId: 123 }),
        };
    },
};
const client = new DocuwareClient("https://example.test/connection", credential, { httpClient });
const response = await client.storeToFileCabinet({
    index: "invoice metadata",
    file: new File([content], fileName, { type: "application/custom" }),
}, "cabinet", "dialog");
assert.deepEqual(response, { DocumentId: 123 });
assert.equal(requestCount, 1);
assert.deepEqual(requestedScopes, [["https://apihub.azure.com/.default"]]);
console.log("Multipart filename round trip passed");
`;

describe.each(["cjs", "esm"])("multipart filenames through the %s distribution", distribution => {
    it.each([
        "invoice.docx",
        "my invoice.docx",
        "r\u00e9sum\u00e9-\u6587\u4ef6.docx",
        "invoice%20paid%.docx",
        'my "invoice".docx',
    ])("should preserve %s through the Azure Core pipeline and native MIME parser", fileName => {
        const output = execFileSync(
            process.execPath,
            ["--input-type=module", "--eval", multipartProbe, distribution, fileName],
            { encoding: "utf8" },
        );

        expect(output).toContain("Multipart filename round trip passed");
    });
});
