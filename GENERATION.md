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

Refreshes and reviews must fetch live definitions. Set `AZURE_SUBSCRIPTION_ID`
and `AZURE_LOCATION` explicitly. Each run uses its own empty temporary
`ARMCACHE_PATH`; never seed it from fixtures or the producer's responses.

```powershell
$env:AZURE_SUBSCRIPTION_ID = "<live-subscription-id>"
$env:AZURE_LOCATION = "<region>"
$outputDirectory = "<output-directory>"
$connectorNames = "<comma-separated-existing-api-names>"
$previousCachePath = $env:ARMCACHE_PATH
$liveCachePath = Join-Path $env:TEMP ("connector-live-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $liveCachePath, $outputDirectory -Force | Out-Null
try {
  $env:ARMCACHE_PATH = $liveCachePath
  LogicAppsCompiler.exe $outputDirectory --directClient --language=typescript "--connectors=$connectorNames"
}
finally {
  $env:ARMCACHE_PATH = $previousCachePath
  Remove-Item $liveCachePath -Recurse -Force
}
```

The command examples below show argument forms; execute them inside this live-download
workflow. Reviewers must make a separate live download and compare outputs; matching
fixture hashes does not prove current service parity.

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

The existing [`generation.manifest.json`](generation.manifest.json) and Swagger
snapshots record fixture provenance for tests. They are not refresh or review
inputs. Generate and review from live metadata independently; do not introduce
new cache folders, catalogs, or offline replay workflows for a client refresh.

### Manifest schema

| Field | Meaning |
|-------|---------|
| `status` | `template` until a run records real values; `generated` for a captured run. |
| `generatedAtUtc` | ISO 8601 UTC timestamp of the generation run. |
| `generator.bpmBaseCommit` | Immutable, reachable BPM commit SHA used as the generator source baseline. |
| `generator.bpmHeadCommit` | Immutable BPM commit whose generator tree the base-plus-patch composition must reproduce. |
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
| `connectors[].generatorCommit` | Optional immutable BPM baseline used instead of `generator.bpmBaseCommit` for one connector; requires `sourcePatch`. |
| `connectors[].sourcePatch.path` | Repository-relative patch required with a connector-specific `generatorCommit`. |
| `connectors[].sourcePatch.sha256` | SHA-256 of the connector-specific patch as canonical UTF-8/LF text. |

### Recording provenance for a run

After live generation with the complete connector set, populate the existing
manifest from the repo root. Update an existing test fixture from the live response
when its tested contract changes, but do not use fixtures as generation inputs:

For a merged generator revision, omit `generator.sourcePatch` and use equal base/head
commits. Detached checkouts are supported. When a patch is present, capture its source
identity before checking out the baseline and verify the composed tree before building:

```powershell
$bpmRepoRoot = "<BPM-repo-root>"
$sdkRepoRoot = (Get-Location).Path
$manifest = Get-Content generation.manifest.json -Raw | ConvertFrom-Json
$sourceHeadCommit = (git -C $bpmRepoRoot rev-parse HEAD)
$sourceBranch = (git -C $bpmRepoRoot branch --show-current)
if ($manifest.generator.sourcePatch -and [string]::IsNullOrWhiteSpace($sourceBranch)) {
  throw "The BPM source must be on the branch used for generation before provenance replay."
}

git -C $bpmRepoRoot checkout $manifest.generator.bpmBaseCommit
if ($manifest.generator.sourcePatch) {
  git -C $bpmRepoRoot apply --index --unidiff-zero (Join-Path $sdkRepoRoot $manifest.generator.sourcePatch.path)
}
git -C $bpmRepoRoot diff --exit-code --cached $sourceHeadCommit -- src/tools/CodefulSdkGenerator src/tools/CodefulSdkGenerator.Tests
git -C $bpmRepoRoot diff --exit-code -- src/tools/CodefulSdkGenerator src/tools/CodefulSdkGenerator.Tests
```

Both final commands must report no differences. `--index` is required so added and
deleted files participate in the comparison with `bpmHeadCommit`. When a connector
records `generatorCommit`, it must also record `sourcePatch`; replay that composition
with the same indexed apply and cached/unstaged checks before regenerating the connector.
Continue in the same PowerShell session when recording the manifest so the source identity
captured before checkout is retained.

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

$manifest.status = "generated"
$manifest.generatedAtUtc = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
$manifest.generator.bpmHeadCommit = $sourceHeadCommit
$manifest.generator.bpmBranch = $sourceBranch
if ($manifest.generator.sourcePatch) {
  $manifest.generator.sourcePatch.sha256 = Get-CanonicalTextSha256 -Path $manifest.generator.sourcePatch.path
}

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
- Existing Swagger snapshots are **test fixtures**, not an input cache for refreshes
  or reviews. Reviewers independently fetch live metadata to detect stale output.
- **Do not hand-edit** the manifest's generated values; let the tooling write them so
  they always match the actual run.
- **The `tests/generationManifest.test.ts` guard runs in CI** and fails the build unless
  `status` is `generated`, the base/head/assembly source composition and any declared
  hashed patch are populated consistently, connector-specific commits have their own patch, and every
  `connectors[].swaggerSha256` and `connectors[].outputSha256` matches the SHA-256 of
  its committed `swagger-cache/` snapshot and canonical UTF-8/LF generated output.
  Regenerate rather than hand-editing so the guard stays green.

## Post-Generation Validation

Validate against a separate fresh live download. A network or authorization failure
is a blocker, not a reason to fall back to fixtures. Check each connector's failures,
not only the process exit code, and preserve the full shipped inventory.

Capture known response data in semantic variables without redundant aliases. For
pageable consumers, test empty and nonempty results and assert the continuation
request and final termination, not just method signatures or iterator construction.

Run these checks from the `Connectors-NodeJS-SDK` repo root:

```powershell
npm run build
npm run typecheck
npm test
npm run typecheck:samples
```
