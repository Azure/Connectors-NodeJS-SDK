# Connector Code Generation

This document describes how to generate typed connector clients using the `LogicAppsCompiler` CLI tool.

## Overview

The **CodefulSdkGenerator** tool generates typed TypeScript clients from managed connector swagger definitions. The generated code provides:

- **Type-safe interfaces** - Input/output types with JSDoc documentation
- **Typed client classes** - Async methods for each connector action extending `ConnectorClientBase`
- **Authentication handling** - Built-in token acquisition for API Hub via `TokenProvider`

## Prerequisites

### Tools Required

1. **Azure Subscription** - Access to an Azure subscription with Logic Apps Standard

2. **Azure authentication (DefaultAzureCredential)**
   - Sign in with an identity that can read managed connector metadata in your target subscription.
   - Typical local setup: run `az login` (and optionally `az account set --subscription <subscription-id>`).

3. **.NET 8 SDK** - For building and running the generator

## Building the Generator

The generator lives in the BPM repository (internal to Microsoft). To build:

```powershell
cd <BPM-repo-root>
.\init.cmd
dotnet build .\src\tools\CodefulSdkGenerator\LogicAppsCompiler.Cli\LogicAppsCompiler.Cli.csproj -c Release
```

## Generation Commands

### Generate TypeScript DirectClient SDK

```powershell
# Generate all connectors
LogicAppsCompiler.exe <output-directory> --directClient --language=typescript

# Generate specific connectors only
LogicAppsCompiler.exe <output-directory> --directClient --language=typescript --connectors=office365

# Example: Generate to this SDK repo's generated folder
LogicAppsCompiler.exe "<path-to-Connectors-NodeJS-SDK>/src/generated" --directClient --language=typescript --connectors=office365
```

**Output structure per connector:**

- `{Connector}Extensions.ts` - Combined typed models and client methods for a connector

### Output files

| File | Purpose |
|------|---------|
| `Office365Extensions.ts` | Generated typed client + models for a connector |
| `ManagedConnectors.ts` | Registry of available connector API names |
| `connectorNames.ts` | String constants for connector names |
| `index.ts` | Barrel exports for generated connectors |

## Rules

- **Never hand-edit generated files.** Fix bugs in the generator, not in generated output.
- Generated files are in `src/generated/` and marked with a "Do not edit" header.
- Runtime infrastructure files in `src/azureConnectors/` are hand-written.

## Important Notes

- Regeneration updates shared generated registry files (`ManagedConnectors.ts`,
   `connectorNames.ts`, and `index.ts`). If you generate with a filtered
   connector set, those registries will reflect only that subset.
- For release-ready updates in this repo, run generation with the complete
   intended connector set to avoid unintentionally dropping existing connectors.

## Provenance & Reproducibility

The generator builds from whatever is currently checked out in the BPM repository and
reads **live** connector metadata from Azure. Neither the generator revision nor the
Swagger inputs are captured by default, so a regeneration cannot be reproduced
byte-for-byte once either source changes, and a cross-language surface delta (for
example, an operation present in the .NET SDK but missing here) cannot be attributed to
a specific cause — stale output, a newer Swagger snapshot, or a generator divergence.

To make regenerations reviewable, every run records provenance in
[`generation.manifest.json`](generation.manifest.json) and persists the exact Swagger
inputs it consumed.

### Manifest schema

| Field | Meaning |
|-------|---------|
| `status` | `template` until a run records real values; `generated` for a captured run. |
| `generatedAtUtc` | ISO 8601 UTC timestamp of the generation run. |
| `generator.bpmBaseCommit` | Immutable, reachable BPM commit SHA used as the generator source baseline. |
| `generator.bpmBranch` | BPM branch the commit was on (informational). |
| `generator.assemblyVersion` | File version of the built `Microsoft.Azure.Workflows.CodefulSdkGenerator.dll`. |
| `generator.sourcePatch.path` | Repository-relative patch applied to `bpmBaseCommit` before building the generator. |
| `generator.sourcePatch.sha256` | SHA-256 of the source patch as canonical UTF-8/LF text. |
| `swaggerSource.subscriptionId` | Azure subscription whose regional managed-connector metadata was read (`AZURE_SUBSCRIPTION_ID`). |
| `swaggerSource.location` | Azure region whose `managedApis` endpoint was read (`AZURE_LOCATION`). |
| `swaggerSource.apiVersion` | Managed-connector API version used to read metadata. |
| `swaggerSource.capturedAtUtc` | UTC time the Swagger snapshots were pulled. |
| `swaggerSource.swaggerCacheDirectory` | Directory holding the content-addressed Swagger snapshots. |
| `connectors[].swaggerSnapshot` | Path to the persisted Swagger the run consumed for that connector. |
| `connectors[].swaggerSha256` | SHA-256 of the snapshot as UTF-8 text with CRLF normalized to LF, so provenance is platform-independent. |
| `connectors[].outputSha256` | SHA-256 of the generated `outputFile` as UTF-8 text with CRLF normalized to LF, so provenance is platform-independent. |

### Recording provenance for a run

After generating (with the complete connector set) and saving each connector's Swagger
snapshot into `swagger-cache/`, populate the manifest from the repo root:

When `generator.sourcePatch` is present, reproduce the generator source before building:

```powershell
git -C <BPM-repo-root> checkout <bpmBaseCommit>
git -C <BPM-repo-root> apply --unidiff-zero <SDK-repo-root>/<sourcePatch.path>
```

```powershell
function Get-CanonicalTextSha256 {
  param([Parameter(Mandatory = $true)][string]$Path)

  $content = [System.IO.File]::ReadAllText($Path).Replace("`r`n", "`n")
  $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes($content)
  $algorithm = [System.Security.Cryptography.SHA256]::Create()
  try {
    $hash = $algorithm.ComputeHash($bytes)
    return ($hash | ForEach-Object { $_.ToString("x2") }) -join ""
  }
  finally {
    $algorithm.Dispose()
  }
}

$bpmRepoRoot = "<BPM-repo-root>"
$manifest = Get-Content generation.manifest.json -Raw | ConvertFrom-Json

$manifest.status = "generated"
$manifest.generatedAtUtc = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
$manifest.generator.bpmBaseCommit = (git -C $bpmRepoRoot rev-parse HEAD)
$manifest.generator.bpmBranch = (git -C $bpmRepoRoot rev-parse --abbrev-ref HEAD)
$manifest.generator.sourcePatch.sha256 = Get-CanonicalTextSha256 -Path $manifest.generator.sourcePatch.path

$dll = Join-Path $bpmRepoRoot "src/tools/CodefulSdkGenerator/bin/Release/Microsoft.Azure.Workflows.CodefulSdkGenerator.dll"
if (-not (Test-Path $dll)) {
  throw "Generator assembly '$dll' was not found. Build the Release configuration before recording provenance."
}

$manifest.generator.assemblyVersion = (Get-Item $dll).VersionInfo.FileVersion

$manifest.swaggerSource.subscriptionId = if ($env:AZURE_SUBSCRIPTION_ID) { $env:AZURE_SUBSCRIPTION_ID } else { "f34b22a3-2202-4fb1-b040-1332bd928c84" }
$manifest.swaggerSource.location = if ($env:AZURE_LOCATION) { $env:AZURE_LOCATION } else { "westus" }
$manifest.swaggerSource.capturedAtUtc = $manifest.generatedAtUtc
foreach ($connector in $manifest.connectors) {
    if (Test-Path $connector.swaggerSnapshot) {
        $connector.swaggerSha256 = Get-CanonicalTextSha256 -Path $connector.swaggerSnapshot
    }

    if (Test-Path $connector.outputFile) {
        $connector.outputSha256 = Get-CanonicalTextSha256 -Path $connector.outputFile
    }
}

$manifest | ConvertTo-Json -Depth 6 | Set-Content generation.manifest.json -Encoding utf8
```

### Rules

- **Commit `generation.manifest.json` in the same PR as the regenerated clients.** A
  regeneration PR without an updated manifest is not reviewable for reproducibility.
- **Persist the Swagger snapshots** referenced by the manifest (the content-addressed
  cache) so the recorded `swaggerSha256` values are verifiable by a reviewer.
- **Do not hand-edit** the manifest's generated values; let the tooling write them so
  they always match the actual run.
- **The `tests/generationManifest.test.ts` guard runs in CI** and fails the build unless
  `status` is `generated`, `generator.bpmBaseCommit` and the hashed source patch are
  populated, and every
  `connectors[].swaggerSha256` and `connectors[].outputSha256` matches the SHA-256 of
  its committed `swagger-cache/` snapshot and canonical UTF-8/LF generated output.
  Regenerate rather than hand-editing so the guard stays green.

## Post-Generation Validation

Run these checks from the `Connectors-NodeJS-SDK` repo root:

```powershell
npm run build
npm run typecheck
npm test
npm run typecheck:samples
```
