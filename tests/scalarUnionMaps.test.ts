// Copyright (c) Microsoft Corporation.  All rights reserved.

import { createHttpHeaders, type HttpClient } from "@azure/core-rest-pipeline";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import * as vm from "node:vm";
import * as ts from "typescript";
import { ConnectorClientBase } from "../src/azureConnectors/clientBase.ts";

const SdkRoot = path.resolve(__dirname, "..");
const VirtualFile = path.join(SdkRoot, "src", "generated", "ScalarunionfixtureExtensions.ts");
const GeneratedText = readFileSync(path.join(__dirname, "fixtures", "ScalarunionfixtureExtensions.ts.txt"), "utf8");
const FixtureSha256 = "ece5dacfe1b1cec92e1bd49128c89365c0b0675192c60e1d32f3ef810bf083ed";
const ConnectionUrl = "https://scalar-maps.example.test/connection";
const ReviewGeneratedText = readFileSync(path.join(__dirname, "fixtures", "ScalarunionreviewExtensions.ts.txt"), "utf8");
const ReviewFixtureSha256 = "fc336f56f5f5166382223f577e9878f60d8808a9eeaaa946c999597f2b4481b4";
const ReviewItemCases = [
    { name: "Scalar", type: "string | boolean", values: ["text", false, "", true] },
    { name: "Nullable", type: "string | boolean | null", values: [null, "text", false] },
    { name: "Nested", type: "Array<string | boolean>", values: [[], ["text", false], ["", true]] },
    { name: "Referenced", type: "UnionItem", values: [false, null, "text"] },
    { name: "Structured", type: "StructuredValue", values: [{ "wire-name": "text" }, { "wire-name": "" }] },
] as const;
const ReviewListCases = ["Root", "Wrapped", "Pageable"].flatMap(shape =>
    ReviewItemCases.map(item => ({ ...item, shape, operation: `List${shape}${item.name}`, method: `list${shape}${item.name}` })));
const ReviewResponseCases = ["EmptyFirst", "SchemaFirst"].flatMap(order =>
    ["Inline", "Reusable"].map(source => ({ operation: `Get${order}${source}`, method: `get${order}${source}` })));
const ReviewMapCases = ["DeclaredMap", "InheritedMap"].map(name => ({ name, operation: `Get${name}`, method: `get${name}` }));

const ReviewRuntimeConsumer = `
export async function exerciseMaps(
    httpClient: NonNullable<ConnectorClientOptions["httpClient"]>,
    minimal: boolean,
): Promise<Record<string, unknown>> {
    const client = new ScalarunionfixtureClient("${ConnectionUrl}", {
        getToken: async () => ({ token: "synthetic-token", expiresOnTimestamp: Number.MAX_SAFE_INTEGER }),
    }, { httpClient });
    const results: Record<string, unknown> = {};
    ${ReviewListCases.map(({ operation, method }) => `
    results.${operation} = [];
    for await (const item of client.${method}()) {
        (results.${operation} as unknown[]).push(item);
    }`).join("\n")}
    ${[...ReviewResponseCases, ...ReviewMapCases].map(({ operation, method }) =>
        `results.${operation} = await client.${method}();`).join("\n")}
    return results;
}
`;

const ReviewPositiveConsumers = `
declare const generatedClient: ScalarunionfixtureClient;
${ReviewListCases.map(({ operation, method, type }) => `
const ${method}Iterator: ConnectorPagedAsyncIterableIterator<${type}> = generatedClient.${method}();
const ${method}Pages: AsyncIterable<Array<${type}>> = generatedClient.${method}().byPage();
type ${operation}Item = ReturnType<ScalarunionfixtureClient["${method}"]> extends AsyncIterable<infer Item> ? Item : never;
`).join("\n")}
${ReviewResponseCases.map(({ method }) =>
        `const ${method}Response: Promise<Array<string | boolean>> = generatedClient.${method}();`).join("\n")}
${ReviewMapCases.map(({ name, method }) => `
const ${method}Value: ${name} = { "wire-name": "text" };
const ${method}Alias: ${name}Alias = ${method}Value;
const ${method}Response: Promise<${name}Alias> = generatedClient.${method}();
`).join("\n")}
`;

const ReviewInvalidConsumers: ReadonlyArray<readonly [string, string]> = [
    ...ReviewListCases.flatMap(({ operation, method }) => [
        [`${method} rejects numeric items`, `const invalid: ${operation}Item = 42;`] as const,
        [`${method} rejects numeric narrowing`, `const invalid: AsyncIterable<number> = generatedClient.${method}();`] as const,
    ]),
    ...ReviewResponseCases.flatMap(({ method }) => [
        [`${method} response narrowing`, `const invalid: Promise<string[]> = generatedClient.${method}();`] as const,
        [`${method} rejects object response`, `const invalid: Promise<Record<string, unknown>> = generatedClient.${method}();`] as const,
    ]),
    ...ReviewMapCases.flatMap(({ name, method }) => [
        ...[name, `${name}Alias`].flatMap(type => [
            [`${type} required property`, `const invalid: ${type} = {};`] as const,
            [`${type} required string`, `const invalid: ${type} = { "wire-name": false };`] as const,
            [`${type} exact wire name`, `const invalid: ${type} = { wire_name: "text" };`] as const,
        ]),
        [`${method} response shape`, `const invalid: Promise<Record<string, boolean>> = generatedClient.${method}();`] as const,
    ]),
    ["nested items reject numbers", 'const invalid: ListRootNestedResponse = [[42]];'],
    ["nonnullable items reject null", 'const invalid: ListRootScalarResponse = [null];'],
    ["wrapped nested items reject numbers", 'const invalid: ListWrappedNestedResponse = { value: [[42]] };'],
    ["pageable nested items reject numbers", 'const invalid: ListPageableNestedResponse = { value: [[42]] };'],
];

const RuntimeConsumer = `
export async function exerciseMaps(
    httpClient: NonNullable<ConnectorClientOptions["httpClient"]>,
    minimal: boolean,
): Promise<{ updated: Envelope; fetched: Envelope }> {
    const client = new ScalarunionfixtureClient("${ConnectionUrl}", {
        getToken: async () => ({ token: "synthetic-token", expiresOnTimestamp: Number.MAX_SAFE_INTEGER }),
    }, { httpClient });
    const input: Envelope = minimal ? {
        "scalar-map": {},
        nullableMap: {},
    } : {
        "scalar-map": { text: "hello", number: 42, fraction: 1.5, flag: true, zero: 0, off: false, empty: "" },
        scalar_map: { distinct: "underscore" },
        oneOfMap: { text: "one", number: 2, flag: false },
        nullableMap: { absent: null, text: "value", number: 0, flag: false },
        nullableAnyOf: { absent: null, text: "nullable" },
        nullableOneOf: { absent: null, flag: true },
        numericMap: { integer: 1, fraction: 1.25 },
        implicitMap: { text: "implicit", flag: false },
        arrayMap: { values: ["text", true, false], empty: [] },
        structuredMap: { item: { "wire-name": "map value" } },
        structuredArray: [{ "wire-name": "array value" }],
        emptyObject: { nested: { values: [1, null] } },
        emptyMap: { arbitrary: ["text", false, null] },
    };
    const updated = await client.updateMaps(input);
    const fetched = await client.getMaps();
    return { updated, fetched };
}
`;

const PositiveConsumers = `
const requiredOnly: Envelope = { "scalar-map": {}, nullableMap: {} };
const fullEnvelope: Envelope = {
    ...requiredOnly,
    scalar_map: undefined,
    oneOfMap: { text: "one", number: 1, boolean: false },
    numericMap: { integer: 1, fraction: 0.25 },
    implicitMap: { text: "text", boolean: true },
    arrayMap: { values: ["text", false] },
    structuredMap: { item: { "wire-name": "value" } },
    structuredArray: [{ "wire-name": "value" }],
    emptyObject: { arbitrary: { nested: null } },
    emptyMap: { arbitrary: [false, 1, "value"] },
};
const textAlias: Text = "text";
const structuredValue: StructuredValue = { "wire-name": textAlias };
declare const generatedClient: ScalarunionfixtureClient;
const updateResponse: Promise<Envelope> = generatedClient.updateMaps(fullEnvelope);
const getResponse: Promise<Envelope> = generatedClient.getMaps();
declare const fetchedEnvelope: Awaited<ReturnType<ScalarunionfixtureClient["getMaps"]>>;
const fetchedScalar: string | number | boolean = fetchedEnvelope["scalar-map"].value;
const fetchedNullable: string | number | boolean | null = fetchedEnvelope.nullableMap.value;
const fetchedStructure: StructuredValue | undefined = fetchedEnvelope.structuredMap?.value;
`;

const InvalidConsumers = [
    ["required scalar map", 'const invalid: Envelope = { nullableMap: {} };'],
    ["required nullable map", 'const invalid: Envelope = { "scalar-map": {} };'],
    ["object scalar value", 'const invalid: Envelope["scalar-map"] = { value: {} };'],
    ["array scalar value", 'const invalid: Envelope["scalar-map"] = { value: [] };'],
    ["null scalar value", 'const invalid: Envelope["scalar-map"] = { value: null };'],
    ["null map", 'const invalid: Envelope["nullableMap"] = null;'],
    ["undefined required map", 'const invalid: Envelope["scalar-map"] = undefined;'],
    ["underscore map value", 'const invalid: Envelope["scalar_map"] = { value: {} };'],
    ["oneOf object value", 'const invalid: Envelope["oneOfMap"] = { value: {} };'],
    ["oneOf null value", 'const invalid: Envelope["oneOfMap"] = { value: null };'],
    ["nullable object value", 'const invalid: Envelope["nullableMap"] = { value: {} };'],
    ["nullable anyOf number", 'const invalid: Envelope["nullableAnyOf"] = { value: 1 };'],
    ["nullable oneOf string", 'const invalid: Envelope["nullableOneOf"] = { value: "true" };'],
    ["numeric string", 'const invalid: Envelope["numericMap"] = { value: "1" };'],
    ["implicit numeric value", 'const invalid: Envelope["implicitMap"] = { value: 1 };'],
    ["array numeric member", 'const invalid: Envelope["arrayMap"] = { value: [1] };'],
    ["array null member", 'const invalid: Envelope["arrayMap"] = { value: [null] };'],
    ["structured scalar value", 'const invalid: Envelope["structuredMap"] = { value: "text" };'],
    ["structured wrong wire name", 'const invalid: Envelope["structuredMap"] = { value: { wire_name: "text" } };'],
    ["structured array wrong value", 'const invalid: Envelope["structuredArray"] = [{ "wire-name": 1 }];'],
    ["input contract", 'generatedClient.updateMaps({ "scalar-map": { value: {} }, nullableMap: {} });'],
    ["response scalar narrowing", 'const invalid: string = fetchedEnvelope["scalar-map"].value;'],
    ["response null exclusion", 'const invalid: string | number | boolean = fetchedEnvelope.nullableMap.value;'],
    ["response structured wire name", 'const invalid = fetchedEnvelope.structuredMap?.value.wire_name;'],
] as const;

/** Compiles the fixture at its normal SDK location without writing generated source. */
function compileConsumer(sourceText: string): readonly ts.Diagnostic[] {
    const config = ts.readConfigFile(path.join(SdkRoot, "tsconfig.json"), ts.sys.readFile);
    if (config.error) {
        return [config.error];
    }

    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, SdkRoot);
    const options: ts.CompilerOptions = { ...parsed.options, noEmit: true, types: ["node"] };
    const host = ts.createCompilerHost(options);
    const originalGetSourceFile = host.getSourceFile.bind(host);
    const originalReadFile = host.readFile.bind(host);
    const originalFileExists = host.fileExists.bind(host);
    const isVirtualFile = (fileName: string): boolean =>
        path.resolve(fileName).toLowerCase() === VirtualFile.toLowerCase();
    host.fileExists = fileName => isVirtualFile(fileName) || originalFileExists(fileName);
    host.readFile = fileName => isVirtualFile(fileName) ? sourceText : originalReadFile(fileName);
    host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) =>
        isVirtualFile(fileName)
            ? ts.createSourceFile(fileName, sourceText, languageVersion, true)
            : originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);

    return [...parsed.errors, ...ts.getPreEmitDiagnostics(ts.createProgram([VirtualFile], options, host))];
}

/** Formats compiler errors so failed consumer assertions show the rejected contract. */
function formatDiagnostics(diagnostics: readonly ts.Diagnostic[]): string[] {
    return diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
}

/** Loads the generated class against the real SDK base, keeping its imports unchanged. */
function loadRuntimeConsumer(
    generatedText = GeneratedText,
    runtimeConsumer = RuntimeConsumer,
): (httpClient: HttpClient, minimal: boolean) => Promise<unknown> {
    const compiled = ts.transpileModule(generatedText + runtimeConsumer, {
        fileName: VirtualFile,
        compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, strict: true },
        reportDiagnostics: true,
    });
    expect(formatDiagnostics(compiled.diagnostics ?? [])).toEqual([]);
    const moduleExports: Record<string, unknown> = {};
    const mappedRequire = (specifier: string): unknown => {
        if (specifier === "../azureConnectors/clientBase.ts") {
            return { ConnectorClientBase };
        }

        throw new Error(`Unexpected generated runtime import '${specifier}'.`);
    };
    vm.runInNewContext(compiled.outputText, { exports: moduleExports, require: mappedRequire }, { filename: VirtualFile });
    expect(typeof moduleExports.exerciseMaps).toBe("function");
    return moduleExports.exerciseMaps as (httpClient: HttpClient, minimal: boolean) => Promise<unknown>;
}

/** Checks every rejection independently by removing its expected-error directive. */
function expectConsumerContracts(prefix: string, invalidConsumers: ReadonlyArray<readonly [string, string]>): void {
    const guarded = invalidConsumers.map(([, source]) => `// @ts-expect-error\n{ ${source} }`).join("\n");
    expect(formatDiagnostics(compileConsumer(`${prefix}\n${guarded}`))).toEqual([]);

    const unguarded = invalidConsumers.map(([, source]) => `{ ${source} }`).join("\n");
    const diagnostics = compileConsumer(`${prefix}\n${unguarded}`);
    const firstInvalidLine = prefix.split("\n").length;
    expect(diagnostics).toHaveLength(invalidConsumers.length);
    invalidConsumers.forEach(([name], index) => {
        const matching = diagnostics.filter(diagnostic =>
            diagnostic.file !== undefined &&
            path.resolve(diagnostic.file.fileName).toLowerCase() === VirtualFile.toLowerCase() &&
            diagnostic.start !== undefined &&
            diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line === firstInvalidLine + index);
        expect({ name, errors: matching.length }).toEqual({ name, errors: 1 });
    });
}

/** Hashes generated text with LF endings so Git checkout settings do not change its identity. */
function computeCanonicalTextSha256(text: string): string {
    return createHash("sha256").update(text.replace(/\r\n/g, "\n"), "utf8").digest("hex");
}

describe("generated scalar-union map consumers (issue #110)", () => {
    it.each(["\n", "\r\n"])("should retain the synthetic generator output with %j line endings", lineEnding => {
        const text = GeneratedText.replace(/\r\n/g, "\n").replace(/\n/g, lineEnding);
        expect(computeCanonicalTextSha256(text)).toBe(FixtureSha256);
        expect(computeCanonicalTextSha256(text.replace("export class", "export abstract class"))).not.toBe(FixtureSha256);
    });

    it("should accept valid consumers and reject every invalid consumer with a negative control", () => {
        expectConsumerContracts(GeneratedText + RuntimeConsumer + PositiveConsumers, InvalidConsumers);
    });

    it.each([false, true])("should preserve JSON maps through generated updateMaps/getMaps (minimal: %s)", async minimal => {
        const expected = minimal ? {
            "scalar-map": {},
            nullableMap: {},
        } : {
            "scalar-map": { text: "hello", number: 42, fraction: 1.5, flag: true, zero: 0, off: false, empty: "" },
            scalar_map: { distinct: "underscore" },
            oneOfMap: { text: "one", number: 2, flag: false },
            nullableMap: { absent: null, text: "value", number: 0, flag: false },
            nullableAnyOf: { absent: null, text: "nullable" },
            nullableOneOf: { absent: null, flag: true },
            numericMap: { integer: 1, fraction: 1.25 },
            implicitMap: { text: "implicit", flag: false },
            arrayMap: { values: ["text", true, false], empty: [] },
            structuredMap: { item: { "wire-name": "map value" } },
            structuredArray: [{ "wire-name": "array value" }],
            emptyObject: { nested: { values: [1, null] } },
            emptyMap: { arbitrary: ["text", false, null] },
        };
        const requests: Array<{ method: string; body: unknown }> = [];
        const httpClient: HttpClient = {
            sendRequest: async request => {
                expect(request.url).toBe(`${ConnectionUrl}/maps`);
                expect(request.headers.get("Authorization")).toBe("Bearer synthetic-token");
                if (request.method === "POST") {
                    expect(typeof request.body).toBe("string");
                    const parsedBody: unknown = JSON.parse(request.body as string);
                    expect(parsedBody).toStrictEqual(expected);
                    requests.push({ method: request.method, body: parsedBody });
                } else {
                    expect(request.method).toBe("GET");
                    expect(request.body).toBeUndefined();
                    requests.push({ method: request.method, body: undefined });
                }

                return {
                    request,
                    status: 200,
                    headers: createHttpHeaders({ "content-type": "application/json" }),
                    bodyAsText: JSON.stringify(expected),
                };
            },
        };

        const result = await loadRuntimeConsumer()(httpClient, minimal);
        expect(result).toStrictEqual({ updated: expected, fetched: expected });
        expect(requests).toStrictEqual([
            { method: "POST", body: expected },
            { method: "GET", body: undefined },
        ]);
    });
});

describe("generated scalar-union review regressions (issue #110)", () => {
    it.each(["\n", "\r\n"])("should retain generator output for all 21 review scenarios with %j line endings", lineEnding => {
        const text = ReviewGeneratedText.replace(/\r\n/g, "\n").replace(/\n/g, lineEnding);
        expect(computeCanonicalTextSha256(text)).toBe(ReviewFixtureSha256);
        expect(computeCanonicalTextSha256(text.replace("export class", "export abstract class"))).not.toBe(ReviewFixtureSha256);
        const operations = [...ReviewListCases, ...ReviewResponseCases, ...ReviewMapCases];
        expect(operations).toHaveLength(21);
        expect([...ReviewGeneratedText.matchAll(/public (?:async )?(\w+)\(/g)].map(match => match[1]))
            .toEqual(operations.map(({ method }) => method));
    });

    it("should compile exact iterator, response, and inherited-property contracts with negative controls", () => {
        expectConsumerContracts(ReviewGeneratedText + ReviewRuntimeConsumer + ReviewPositiveConsumers, ReviewInvalidConsumers);
    });

    it.each([false, true])("should preserve all review shapes and follow empty first pages (minimal: %s)", async minimal => {
        const expected: Record<string, unknown> = {};
        const expectedRequests: string[] = [];
        const responses = new Map<string, unknown>();
        for (const { operation, shape, values } of ReviewListCases) {
            const items = minimal ? [] : values;
            const firstUrl = `${ConnectionUrl}/${operation}`;
            expected[operation] = items;
            expectedRequests.push(firstUrl);
            if (shape === "Pageable") {
                const nextUrl = `${firstUrl}?page=2`;
                responses.set(firstUrl, { value: [], nextLink: nextUrl });
                responses.set(nextUrl, { value: items });
                expectedRequests.push(nextUrl);
            } else {
                responses.set(firstUrl, shape === "Root" ? items : { value: items });
            }
        }

        for (const { operation } of ReviewResponseCases) {
            const url = `${ConnectionUrl}/${operation}`;
            expected[operation] = minimal ? [] : ["text", false, "", true];
            responses.set(url, expected[operation]);
            expectedRequests.push(url);
        }

        for (const { operation } of ReviewMapCases) {
            const url = `${ConnectionUrl}/${operation}`;
            expected[operation] = { "wire-name": minimal ? "" : "text" };
            responses.set(url, expected[operation]);
            expectedRequests.push(url);
        }

        const requests: string[] = [];
        const httpClient: HttpClient = {
            sendRequest: async request => {
                expect(request.method).toBe("GET");
                expect(request.body).toBeUndefined();
                expect(request.headers.get("Authorization")).toBe("Bearer synthetic-token");
                expect(responses.has(request.url)).toBe(true);
                expect(requests.length).toBeLessThan(expectedRequests.length);
                requests.push(request.url);
                return {
                    request,
                    status: 200,
                    headers: createHttpHeaders({ "content-type": "application/json" }),
                    bodyAsText: JSON.stringify(responses.get(request.url)),
                };
            },
        };

        expect(await loadRuntimeConsumer(ReviewGeneratedText, ReviewRuntimeConsumer)(httpClient, minimal)).toStrictEqual(expected);
        expect(requests).toStrictEqual(expectedRequests);
        expect(requests).toHaveLength(26);
    });
});