// Copyright (c) Microsoft Corporation.  All rights reserved.

import assert from "node:assert/strict";
import { test } from "node:test";
import ts from "typescript";
import { validatePublicApi } from "./validate-api-docs.mjs";

const fileName = "src/generated/ExampleExtensions.ts";
const source = `
export interface Input { value: string; }
export class ExampleClient {
    public send(input: Input): void {}
    public static create(): ExampleClient { return new ExampleClient(); }
    private secret(): void {}
    protected hidden(): void {}
    /** @internal */
    public internal(): void {}
}
/** @internal */
export interface Internal { value: string; }
`;
const host = ts.createCompilerHost({});
const originalGetSourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (requestedFile, languageVersion, ...options) =>
    requestedFile === fileName
        ? ts.createSourceFile(fileName, source, languageVersion, true)
        : originalGetSourceFile(requestedFile, languageVersion, ...options);
const program = ts.createProgram([fileName], {}, host);

function createDocumentation() {
    return {
        children: [{
            name: "generated/ExampleExtensions",
            children: [
                { name: "Input", children: [{ name: "value" }] },
                { name: "ExampleClient", children: [{ name: "send" }, { name: "create" }] },
            ],
        }],
    };
}

test("accepts complete exports and public instance/static members, excluding nonpublic APIs", () => {
    assert.deepEqual(validatePublicApi(program, createDocumentation(), [fileName]),
        { moduleCount: 1, exportCount: 2, memberCount: 3 });
});

test("rejects a missing connector module", () => {
    assert.throws(() => validatePublicApi(program, { children: [] }, [fileName]),
        /Missing API documentation/);
});

test("rejects an undocumented public model", () => {
    const documentation = createDocumentation();
    documentation.children[0].children.shift();
    assert.throws(() => validatePublicApi(program, documentation, [fileName]),
        /Missing public export 'Input'/);
});

test("rejects an undocumented model property", () => {
    const documentation = createDocumentation();
    documentation.children[0].children[0].children = [];
    assert.throws(() => validatePublicApi(program, documentation, [fileName]),
        /Missing public member 'generated\/ExampleExtensions.Input.value'/);
});

test("rejects an undocumented client operation", () => {
    const documentation = createDocumentation();
    documentation.children[0].children[1].children.shift();
    assert.throws(() => validatePublicApi(program, documentation, [fileName]),
        /Missing public member 'generated\/ExampleExtensions.ExampleClient.send'/);
});

test("rejects an undocumented static client member", () => {
    const documentation = createDocumentation();
    documentation.children[0].children[1].children.pop();
    assert.throws(() => validatePublicApi(program, documentation, [fileName]),
        /Missing public member 'generated\/ExampleExtensions.ExampleClient.create'/);
});

test("validates members through a catalog re-export reference", () => {
    const documentation = createDocumentation();
    const client = documentation.children[0].children[1];
    client.id = 42;
    documentation.children.push({ name: "implementation", children: [client] });
    documentation.children[0].children[1] = { name: "ExampleClient", variant: "reference", target: 42 };
    assert.equal(validatePublicApi(program, documentation, [fileName]).memberCount, 3);
    client.children.shift();
    assert.throws(() => validatePublicApi(program, documentation, [fileName]),
        /Missing public member.*ExampleClient.send/);
});

test("rejects a broken catalog re-export reference", () => {
    const documentation = createDocumentation();
    documentation.children[0].children[1] = { name: "ExampleClient", variant: "reference", target: 42 };
    assert.throws(() => validatePublicApi(program, documentation, [fileName]),
        /Unresolved documentation reference/);
});
