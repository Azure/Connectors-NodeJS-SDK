# Scalar-union consumer fixtures

`ScalarunionfixtureExtensions.ts.txt` contains exact generator output for issue
[#110](https://github.com/Azure/Connectors-NodeJS-SDK/issues/110). The input is the
synthetic pinned schema in BPM's
`src/tools/CodefulSdkGenerator.Tests/DirectClientTypeScriptScalarUnionTests.cs`.
This is not a production connector refresh. No live Swagger was downloaded.

Generated on 2026-10-19 from the source now committed as BPM
`c995a1a7cf144f9211305f078ec5610938872321`, based on `master` commit
`e2d2073a07d88d1fbb1a65a61df27b41b0ed5627`.
[BPM PR 17586353](https://msazure.visualstudio.com/One/_git/AzureUX-BPM/pullrequest/17586353)
is active and unmerged.
Upstream integration remains an SDK PR merge gate.
The SHA-256 values identify the source file bytes at generation time:

| BPM source | SHA-256 |
| --- | --- |
| `src/tools/CodefulSdkGenerator/DirectClient/DirectClientGeneratorBase.cs` | `25a52b78c87f96ae710ed6a2fa781927d26dcd167bdd370e69a1e8579c62299f` |
| `src/tools/CodefulSdkGenerator/DirectClient/DirectClientMethodInfo.cs` | `2759574110f2740e22f789cbfbf287b7d0dd41a0ad5af769f28d58e3aed4f9e5` |
| `src/tools/CodefulSdkGenerator/DirectClient/DirectClientTypeScriptCodeGenerator.cs` | `8b9cc6ad8569b4e4f0c5635fd730863cc465f32629197e6c0b84c75efff42b80` |
| `src/tools/CodefulSdkGenerator/DirectClient/DirectClientTypeScriptGenerator.cs` | `f424e83a788014516626acb7e784fbbc45994e34ebe90bb02c5c7af652a95720` |
| `src/tools/CodefulSdkGenerator/DirectClient/TypeScriptScalarUnionResolver.cs` | `0437233077811c544bce2a44526565436df53270c44e6b1136a7365b852a9308` |
| `src/tools/CodefulSdkGenerator.Tests/DirectClientTypeScriptScalarUnionTests.cs` | `2327cbdb7089b911f9f8ec8043655fcc94507e8263b2b0962838b307f2750542` |

The disposable harness in the temporary `issue110-sdk-review-fixture` directory
loaded BPM's final test build from `src/tools/CodefulSdkGenerator.Tests/bin/Debug/`.
The test and compiler assemblies were built after the source files above, and the
source files matched the local commit. It invoked `GenerateFixture()` and wrote
the returned text directly here, without edits. The pinned output hash is unchanged.

| Built assembly | SHA-256 |
| --- | --- |
| `Internal.LogicApps.CodefulSdkGenerator.Tests.dll` | `75d98e6c871557e4ff82d7569d963aff74372623c2f37cc44286f80a8ff5cb60` |
| `LogicAppsCompiler.dll` | `0e54d5e63dfcb6c0ad90064ab04f5f829cbb2d40848218c4aab96c6ad64dbc3f` |

Generated file SHA-256 (raw bytes):
`35eeee02f46b9990ab25b11402842a7aed7b5d2c0f04a77f78bf9ba465673712`.

## Review regression fixture

`ScalarunionreviewExtensions.ts.txt` adds the 21 cases from the committed BPM
review tests without changing the pinned Swagger or its fixture. The same
temporary harness read the public `ScalarUnionSwagger` constant, changed a parsed
copy, and invoked the private static `Generate(JsonObject)` method through
reflection. It wrote the returned text without edits. The generator still uses
the connector name `scalarunionfixture`, so both fixtures export the same client
class and compile separately.

To reproduce the review input, keep the pinned definitions, replace `paths` with
these 21 GET operations, and preserve the order below. Each path is `/` followed
by its operation ID; set its summary to the operation ID.

### List operations

Add `UnionItem` with `type: ["string", "boolean", "null"]`. For each of
`Root`, `Wrapped`, and `Pageable`, add five `List{shape}{item}` operations.
The item names and schemas, in order, are:

- `Scalar`: `type: ["string", "boolean"]`.
- `Nullable`: `type: ["string", "boolean", "null"]`.
- `Nested`: an array with `Scalar` items.
- `Referenced`: `$ref: "#/definitions/UnionItem"`.
- `Structured`: `$ref: "#/definitions/StructuredValue"`.

Each 200 response has description `OK`. `Root` returns an array of those
items. `Wrapped` returns an object with an optional `value` array. `Pageable`
adds an optional string `nextLink` to that object.

### Success-response operations

Add the reusable response `UnionArray` with description `OK` and an array of
`Scalar` items. Add `GetEmptyFirstInline`, `GetEmptyFirstReusable`,
`GetSchemaFirstInline`, and `GetSchemaFirstReusable`. Each has a 204 response
with description `No content` and a 200 response with that union array schema,
either inline or through `$ref: "#/responses/UnionArray"`. Insert 204 before
200 for `EmptyFirst` and after 200 for `SchemaFirst`.

### Declared-property operations

Add `DeclaredMap` and `InheritedMap` as objects with scalar union
`additionalProperties` (`type: ["string", "boolean"]`). `DeclaredMap` requires
the string property `wire-name`. `InheritedMap` gets that property through
`allOf: [{ "$ref": "#/definitions/StructuredValue" }]`. Add an alias definition
referencing each map. Add `GetDeclaredMap` and `GetInheritedMap`, each returning
its alias in a 200 response with description `OK`.

Review generated file SHA-256 (raw bytes):
`11db365b03cc02bfffcd4c8a94d71abf506c901672d535d01d75c6af1a2454c7`.

The consumer tests verify both output hashes and compile each fixture at a
virtual SDK generated-source path. Valid consumers check iterator, page, response,
and required-property contracts. Expected-error directives must cover every
invalid consumer; removing them must produce one error per consumer as a negative
control.

Runtime tests map the unchanged base-class import to the real SDK and inject an
HTTP transport. The review fixture exercises all 21 operations with empty and
nonempty collections, including false, null, nested arrays, and exact wire names.
Each pageable operation follows an empty first page to a second page and stops
when `nextLink` is absent; each run checks all 26 requests in order.

No production generated files or manifest entries change. Regenerate these
fixtures from the synthetic schema; do not edit the generated text.
