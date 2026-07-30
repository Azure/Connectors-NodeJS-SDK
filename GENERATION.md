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
LogicAppsCompiler.exe <output-directory> unused --directClient --language=typescript

# Generate specific connectors only
LogicAppsCompiler.exe <output-directory> unused --directClient --language=typescript --connectors=office365

# Example: Generate to this SDK repo's generated folder
LogicAppsCompiler.exe "<path-to-Connectors-NodeJS-SDK>/src/generated" unused --directClient --language=typescript --connectors=office365
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
| `generator.bpmCommit` | Immutable BPM commit SHA the generator was built from. |
| `generator.bpmBranch` | BPM branch the commit was on (informational). |
| `generator.assemblyVersion` | File version of the built `Microsoft.Azure.Workflows.CodefulSdkGenerator.dll`. |
| `swaggerSource.apiVersion` | Managed-connector API version used to read metadata. |
| `swaggerSource.capturedAtUtc` | UTC time the Swagger snapshots were pulled. |
| `swaggerSource.swaggerCacheDirectory` | Directory holding the content-addressed Swagger snapshots. |
| `connectors[].swaggerSnapshot` | Path to the persisted Swagger the run consumed for that connector. |
| `connectors[].swaggerSha256` | SHA-256 of that snapshot, so byte-level reproduction is verifiable. |

### Recording provenance for a run

After generating (with the complete connector set) and saving each connector's Swagger
snapshot into `swagger-cache/`, populate the manifest from the repo root:

```powershell
$bpmRepoRoot = "<BPM-repo-root>"
$manifest = Get-Content generation.manifest.json -Raw | ConvertFrom-Json

$manifest.status = "generated"
$manifest.generatedAtUtc = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
$manifest.generator.bpmCommit = (git -C $bpmRepoRoot rev-parse HEAD)
$manifest.generator.bpmBranch = (git -C $bpmRepoRoot rev-parse --abbrev-ref HEAD)

$dll = Join-Path $bpmRepoRoot "src/tools/CodefulSdkGenerator/bin/Release/net8.0/Microsoft.Azure.Workflows.CodefulSdkGenerator.dll"
if (Test-Path $dll) { $manifest.generator.assemblyVersion = (Get-Item $dll).VersionInfo.FileVersion }

$manifest.swaggerSource.capturedAtUtc = $manifest.generatedAtUtc
foreach ($connector in $manifest.connectors) {
    if (Test-Path $connector.swaggerSnapshot) {
        $connector.swaggerSha256 = (Get-FileHash $connector.swaggerSnapshot -Algorithm SHA256).Hash.ToLowerInvariant()
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

## Post-Generation Validation

Run these checks from the `Connectors-NodeJS-SDK` repo root:

```powershell
npm run build
npm run typecheck
npm test
npm run typecheck:samples
```
