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

Schema v4 of [`generation.manifest.json`](generation.manifest.json) separates
hashes of consumed live definitions from hashes of repository test fixtures.
Fixtures are not refresh or review inputs. Generate and review from live metadata
independently; do not introduce new cache folders, catalogs, or offline replay workflows.

`swaggerInputSha256` identifies the actual definition consumed by the run.
`swaggerFixtureSha256` identifies the existing test fixture, which may differ.
Fixture hash checks do not establish fixture origin, live freshness, or generation
input identity. No capture time is inferred for an old fixture. Because temporary
responses are deleted, input hashes provide attribution, not a retained replay artifact.

For paired generator/SDK PRs, publish the generated result from the linked active
BPM PR and record its exact source commit and unmerged status. Upstream integration
is a separate final merge gate, not a prerequisite for showing the paired output.

### Manifest schema

| Field | Meaning |
|-------|---------|
| `manifestVersion` | `4`, separating live-input metadata from repository fixture hashes. |
| `status` | `template` until a run records real values; `generated` for a captured run. |
| `captureStartedAtUtc` | Start of the complete live capture, before any request is made. |
| `generatedAtUtc` | End of the complete generation run; not earlier than any input capture. |
| `generator.bpmBaseCommit` | Immutable, reachable BPM commit SHA used as the generator source baseline. |
| `generator.bpmHeadCommit` | Immutable BPM commit whose generator tree the base-plus-patch composition must reproduce. |
| `generator.bpmBranch` | BPM branch the commit was on (informational). |
| `generator.assemblyVersion` | File version of the built `Microsoft.Azure.Workflows.CodefulSdkGenerator.dll`. |
| `generator.sourcePatch.path` | Repository-relative patch applied to `bpmBaseCommit` before building the generator. |
| `generator.sourcePatch.sha256` | SHA-256 of the source patch as canonical UTF-8/LF text. |
| `swaggerSource.subscriptionId` | Azure subscription whose regional managed-connector metadata was read (`AZURE_SUBSCRIPTION_ID`). |
| `swaggerSource.location` | Azure region whose `managedApis` endpoint was read (`AZURE_LOCATION`). |
| `swaggerSource.apiVersion` | Managed-connector API version used to read metadata. |
| `connectors[].swaggerInputSha256` | SHA-256 of the freshly fetched definition actually consumed, as canonical UTF-8/LF text. |
| `connectors[].capturedAtUtc` | Actual live response time, bounded by this run's capture start and generation end. |
| `connectors[].swaggerFixture` | Repository-relative test fixture path; not a claimed generation input. |
| `connectors[].swaggerFixtureSha256` | Canonical SHA-256 of that fixture, independent of the live-input hash. |
| `connectors[].outputSha256` | SHA-256 of the generated `outputFile` as UTF-8 text with CRLF normalized to LF, so provenance is platform-independent. |
| `connectors[].generatorCommit` | Optional immutable BPM baseline used instead of `generator.bpmBaseCommit` for one connector; requires `sourcePatch`. |
| `connectors[].sourcePatch.path` | Repository-relative patch required with a connector-specific `generatorCommit`. |
| `connectors[].sourcePatch.sha256` | SHA-256 of the connector-specific patch as canonical UTF-8/LF text. |

### Recording provenance for a run

The recipe below generates the complete manifest allowlist and populates provenance
from the actual live responses. Partial runs must not relabel untouched entries as
fresh captures. Update a fixture only when its tested contract changes; its hash is
not substituted for a missing live-input hash. Use PowerShell 7.5 or later so
`ConvertFrom-Json -DateKind String` preserves canonical timestamp strings.

This recipe expects a schema-v4 manifest. Legacy `swaggerSnapshot` and
`swaggerSha256` fields migrate to fixture fields, not live-input provenance;
new input hashes and capture times must come from a fresh complete run.

For a merged generator revision, omit `generator.sourcePatch` and use equal base/head
commits. Detached checkouts are supported. When a patch is present, capture its source
identity before checking out the baseline and verify the composed tree before building:

```powershell
$bpmRepoRoot = "<BPM-repo-root>"
$sdkRepoRoot = (Get-Location).Path
$manifest = Get-Content generation.manifest.json -Raw | ConvertFrom-Json -DateKind String
$sourceHeadCommit = (git -C $bpmRepoRoot rev-parse HEAD)
$sourceBranch = (git -C $bpmRepoRoot branch --show-current)
if ($manifest.generator.sourcePatch -and [string]::IsNullOrWhiteSpace($sourceBranch)) {
  throw "The BPM source must be on the branch used for generation before provenance replay."
}

if ($manifest.generator.sourcePatch) {
  git -C $bpmRepoRoot checkout $manifest.generator.bpmBaseCommit
  git -C $bpmRepoRoot apply --index --unidiff-zero (Join-Path $sdkRepoRoot $manifest.generator.sourcePatch.path)
  if ($LASTEXITCODE -ne 0) { throw "Generator source patch could not be applied." }
}
else {
  git -C $bpmRepoRoot checkout $sourceHeadCommit
  if ($LASTEXITCODE -ne 0) { throw "The captured generator revision could not be checked out." }
  $manifest.generator.bpmBaseCommit = $sourceHeadCommit
}
git -C $bpmRepoRoot diff --exit-code --cached $sourceHeadCommit -- src/tools/CodefulSdkGenerator src/tools/CodefulSdkGenerator.Tests
if ($LASTEXITCODE -ne 0) { throw "Staged generator source differs from the captured revision." }
git -C $bpmRepoRoot diff --exit-code -- src/tools/CodefulSdkGenerator src/tools/CodefulSdkGenerator.Tests
if ($LASTEXITCODE -ne 0) { throw "Unstaged generator changes remain." }
```

Both final commands must report no differences. `--index` is required so added and
deleted files participate in the comparison with `bpmHeadCommit`. When a connector
records `generatorCommit`, it must also record `sourcePatch`; replay that composition
with the same indexed apply and cached/unstaged checks before regenerating the connector.
Continue in the same PowerShell session when recording the manifest so the source identity
captured before checkout is retained. Rebuild the CLI in Release configuration from
that verified composition before continuing. Do not rely on an existing binary.

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
$manifest.manifestVersion = 4
$manifest.generator.bpmHeadCommit = $sourceHeadCommit
$manifest.generator.bpmBranch = $sourceBranch
if ($manifest.generator.sourcePatch) {
  $manifest.generator.sourcePatch.sha256 = Get-CanonicalTextSha256 -Path $manifest.generator.sourcePatch.path
}

$dll = Join-Path $bpmRepoRoot "src/tools/CodefulSdkGenerator/LogicAppsCompiler.Cli/bin/Release/LogicAppsCompiler.dll"
if (-not (Test-Path $dll)) {
  throw "Generator assembly '$dll' was not found. Build the Release configuration before recording provenance."
}

$manifest.generator.assemblyVersion = (Get-Item $dll).VersionInfo.FileVersion

if (-not $env:AZURE_SUBSCRIPTION_ID -or -not $env:AZURE_LOCATION) {
  throw "Set an explicit live subscription and region before generation."
}
$manifest.swaggerSource.subscriptionId = $env:AZURE_SUBSCRIPTION_ID
$manifest.swaggerSource.location = $env:AZURE_LOCATION
$previousCachePath = $env:ARMCACHE_PATH
$liveCachePath = Join-Path $env:TEMP ("connector-live-" + [guid]::NewGuid())
$outputDirectory = Join-Path $sdkRepoRoot "src/generated"
New-Item -ItemType Directory -Path $liveCachePath, $outputDirectory -Force | Out-Null
try {
  $env:ARMCACHE_PATH = $liveCachePath
  $manifest.captureStartedAtUtc = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
  $generationOutput = dotnet $dll $outputDirectory --directClient --language=typescript ("--connectors=" + ($manifest.connectors.apiName -join ","))
  if ($LASTEXITCODE -ne 0 -or $generationOutput -match "' failed:") {
    throw "One or more connectors failed generation."
  }
  foreach ($connector in $manifest.connectors) {
    $url = "https://management.azure.com/subscriptions/$env:AZURE_SUBSCRIPTION_ID/providers/Microsoft.Web/locations/$env:AZURE_LOCATION/managedApis/$($connector.apiName)?api-version=$($manifest.swaggerSource.apiVersion)&export=true"
    $key = [Convert]::ToHexString([Security.Cryptography.SHA1]::HashData([Text.Encoding]::UTF8.GetBytes($url)))
    $responsePath = Join-Path $liveCachePath $key
    if (-not (Test-Path $responsePath)) { throw "A consumed live definition is missing." }
    $connector.swaggerInputSha256 = Get-CanonicalTextSha256 -Path $responsePath
    $connector.capturedAtUtc = (Get-Item $responsePath).LastWriteTimeUtc.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    $connector.swaggerFixtureSha256 = Get-CanonicalTextSha256 -Path $connector.swaggerFixture
        $connector.outputSha256 = Get-CanonicalTextSha256 -Path $connector.outputFile
    }
  $manifest.generatedAtUtc = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
  $manifest | ConvertTo-Json -Depth 12 | Set-Content generation.manifest.json -Encoding utf8
}
finally {
  $env:ARMCACHE_PATH = $previousCachePath
  Remove-Item $liveCachePath -Recurse -Force
}
```

### Rules

- **Commit `generation.manifest.json` in the same PR as the regenerated clients.** A
  regeneration PR must identify the exact generator and consumed live-input hashes.
- Existing Swagger snapshots are **test fixtures**, not an input cache for refreshes
  or reviews. Reviewers independently fetch live metadata to detect stale output.
- **Do not hand-edit** the manifest's generated values; let the tooling write them so
  they always match the actual run.
- **The `tests/generationManifest.test.ts` guard runs in CI** and fails the build unless
  `status` is `generated`, the base/head/assembly source composition and any declared
  hashed patch are populated consistently, connector-specific commits have their own patch, and every
  live-input hash/capture timestamp is present and bounded by the generation window.
  Fixture and output hashes are independently checked against repository files;
  `swaggerFixtureSha256` is never presented as the live definition consumed.
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
