# Scalar-map consumer fixture

`ScalarunionfixtureExtensions.ts.txt` contains exact generator output for issue
[#110](https://github.com/Azure/Connectors-NodeJS-SDK/issues/110). The input is the
synthetic pinned schema in BPM's new
`src/tools/CodefulSdkGenerator.Tests/DirectClientTypeScriptScalarUnionTests.cs`.
This is not a production connector refresh. No live Swagger was downloaded.

Generated on 2026-10-19 from the source now committed as BPM
`5fd87c61370726dd9bc44be839bb5fe2cdd1243a`, based on `master` commit
`e2d2073a07d88d1fbb1a65a61df27b41b0ed5627`.
[BPM PR 17586353](https://msazure.visualstudio.com/One/_git/AzureUX-BPM/pullrequest/17586353)
is active and unmerged. Upstream integration remains an SDK PR merge gate.
The SHA-256 values identify the source file bytes at generation time:

| BPM source | SHA-256 |
| --- | --- |
| `src/tools/CodefulSdkGenerator/DirectClient/DirectClientTypeScriptCodeGenerator.cs` | `c106f1907174b6da72732b4e0b9b2d57d980c43e6ddeec68e624e0ffda05a998` |
| `src/tools/CodefulSdkGenerator/DirectClient/DirectClientTypeScriptGenerator.cs` | `a105225a546d5d814741e9a532ee9ca592fa5779c0b03620f2ee7d62071cc76e` |
| `src/tools/CodefulSdkGenerator/DirectClient/TypeScriptScalarUnionResolver.cs` | `0437233077811c544bce2a44526565436df53270c44e6b1136a7365b852a9308` |
| `src/tools/CodefulSdkGenerator.Tests/DirectClientTypeScriptScalarUnionTests.cs` | `91fddd4f7e7327511eea0b5d5a2fea58390fddb6e4f3238d89cf7c6d0c0a1b32` |

The temporary fixture harness invoked `GenerateFixture()` in the matching
`issue110-validation-final/Internal.LogicApps.CodefulSdkGenerator.Tests.dll`
assembly and wrote its returned text directly here, without edits.

Generated file SHA-256 (raw bytes):
`35eeee02f46b9990ab25b11402842a7aed7b5d2c0f04a77f78bf9ba465673712`.
The consumer test verifies this hash and compiles the text at a virtual SDK
generated-source path. Runtime tests map the unchanged base-class import to the
real SDK and inject an HTTP transport. No production generated files or manifest
entries change. Regenerate this fixture from the synthetic schema; do not edit it.
