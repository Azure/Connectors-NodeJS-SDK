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
const FixtureSha256 = "35eeee02f46b9990ab25b11402842a7aed7b5d2c0f04a77f78bf9ba465673712";
const ConnectionUrl = "https://scalar-maps.example.test/connection";

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
function loadRuntimeConsumer(): (httpClient: HttpClient, minimal: boolean) => Promise<unknown> {
    const compiled = ts.transpileModule(GeneratedText + RuntimeConsumer, {
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

describe("generated scalar-union map consumers (issue #110)", () => {
    it("should retain the exact synthetic generator output", () => {
        const bytes = readFileSync(path.join(__dirname, "fixtures", "ScalarunionfixtureExtensions.ts.txt"));
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(FixtureSha256);
    });

    it("should accept valid consumers and reject every invalid consumer with a negative control", () => {
        const prefix = GeneratedText + RuntimeConsumer + PositiveConsumers;
        const guarded = InvalidConsumers.map(([, source]) => `// @ts-expect-error\n{ ${source} }`).join("\n");
        expect(formatDiagnostics(compileConsumer(`${prefix}\n${guarded}`))).toEqual([]);

        const unguarded = InvalidConsumers.map(([, source]) => `{ ${source} }`).join("\n");
        const controlSource = `${prefix}\n${unguarded}`;
        const diagnostics = compileConsumer(controlSource);
        const firstInvalidLine = prefix.split("\n").length;
        expect(diagnostics).toHaveLength(InvalidConsumers.length);
        InvalidConsumers.forEach(([name], index) => {
            const matching = diagnostics.filter(diagnostic =>
                diagnostic.file !== undefined &&
                path.resolve(diagnostic.file.fileName).toLowerCase() === VirtualFile.toLowerCase() &&
                diagnostic.start !== undefined &&
                diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line === firstInvalidLine + index);
            expect({ name, errors: matching.length }).toEqual({ name, errors: 1 });
        });
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