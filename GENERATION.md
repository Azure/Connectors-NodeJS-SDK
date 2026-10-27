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

Schema v5 of [`generation.manifest.json`](generation.manifest.json) separates
hashes of consumed live definitions from hashes of repository test fixtures.
Fixtures are not refresh or review inputs. Generate and review from live metadata
independently; do not introduce new cache folders, catalogs, or offline replay workflows.

### Partial live refreshes

Schema v5 keeps the original top-level source and capture window as the default
for retained clients. Each refreshed connector names a `runId` in `generationRuns`.
That run records its own source composition, live endpoint, capture window, and
independent validation window. Never update the default source or timestamps to
make an untouched client appear fresh. Existing connector-specific source patches
still apply to retained clients; refreshed entries use their run's source instead.

`refresh.refreshedConnectors` names the exact refreshed set.
`refresh.retainedConnectors` names every retained client and explains why it was
not refreshed. Each refreshed entry's `validation` records the second run's ID,
capture time, input hash, and output hash. Both runs must independently fetch live
metadata into new empty GUID-named temporary caches. Compare all 74 input hashes
and all generated client and shared-file hashes before replacing output. Delete
both response stores, even on failure. Input hashes identify consumed raw ARM
response text with CRLF normalized to LF, not reordered JSON.

The October 21 refresh retained Orderful because fresh probes returned `ApiNotFound`
in westus, eastus, westcentralus, and westeurope. Its client bytes and October 8
provenance remained unchanged. The other 74 clients used BPM source
`ae43130532c83c922aea4ad9d39bc44a86f71f5c` on `swapnil/issue110` in the paired,
active, unmerged
[BPM PR 17586353](https://msazure.visualstudio.com/One/_git/AzureUX-BPM/pullrequest/17586353)
which required integration before the SDK PR could merge. The dynamic-schema guard fix preserves open dynamic
payloads, including SharePoint item inputs, while keeping typed dictionary values.
The manifest retains the publication state observed during capture: the source
was then locally committed but unpushed, and the PR still pointed to
`c995a1a7cf144f9211305f078ec5610938872321`. These historical fields do not
describe the current remote branch. Synthetic scalar-union fixture provenance
also remains at `c995a1a7cf144f9211305f078ec5610938872321`.
The patch comes directly from the Git diff against
`e2d2073a07d88d1fbb1a65a61df27b41b0ed5627`. Indexed replay in a disposable
worktree must match the target generator and test trees, with no unstaged changes.
Build the actual verified source in Release; an existing binary is not evidence.
The run records the assembly bytes used for both downloads. BPM embeds the local
build time in `AssemblyInformationalVersion`, so later builds can have different
assembly hashes without source changes. Do not replace a captured run's assembly
hash with the hash of a later test build.

For the complete 75-entry registries, call the built generator's
`GenerateNavigatorClass` and `GenerateAuxiliaryFiles` methods in a disposable
process. Supply the 74 freshly generated client class names and live ARM-list
display names, plus Orderful's retained `OrderfulClient`/`Orderful` metadata.
These methods need class metadata, not Swagger. Do not fetch an old Orderful
schema, generate its client, or claim that its metadata was captured in this run.
Record hashes for all three shared files in `refresh.sharedFiles`. Keep the
disposable harness and response stores outside the repository.

### October 27 connector expansion

The current inventory contains 99 clients: 24 additional connectors from
[#117](https://github.com/Azure/Connectors-NodeJS-SDK/issues/117), the 74 previously
available clients, and retained Orderful. The current refresh uses merged BPM
`master` commit `21a5e28e029a1e58304b3c4d66302cbb528ed1fd`, built in Release
with assembly version `1.196.0.28`. Its source needs no patch. The earlier
October 21 run described above remains historical provenance, not the current
generator publication state.

Both current live runs explicitly use subscription
`1a839f1f-10b2-4613-95ad-0800a22abbf2`, region `westus`, and managed-API version
`2018-07-01-preview`. Each run starts with a separate empty temporary response
store. Compare the 98 available clients' consumed input hashes and generated
output hashes before accepting the refresh. New Swagger files under
`swagger-cache` are independently captured test fixtures, not generation or
validation inputs.

The first run also requested `onedrive` and `universalprint`. Both were absent
from the live catalog and returned HTTP 404 / `ApiNotFound`; separate probes
confirmed the same error in `eastus`, `westcentralus`, and `westeurope`.
The requester approved integrating the other 24 new connectors while tracking
these two as blocked. Do not generate replacements from old fixtures or silently
substitute OneDrive for Business. Azure DevOps and Dataflows use the confirmed
live API IDs `visualstudioteamservices` and `dataflows`.

Generate all three shared files through `GenerateNavigatorClass` and
`GenerateAuxiliaryFiles`, supplying the complete 99-entry inventory: 98 live
client class/display names and Orderful's retained metadata. Compare both runs'
complete shared files as well as the client files. Preserve Orderful's client
bytes and original provenance; do not imply that it was downloaded in this run.

The requester also approved the live-definition changes to three existing
clients. ClickSend drops `sendVoice`, `sendFax`, `sendLetter`, and `sendPostcard`
and adds `sendSmsCampaign`. Jira's filter/project lists and Insightly's project
list now follow their live continuation fields. These changes have focused
serialization, failure, and multi-page tests and are documented under breaking
changes in [CHANGELOG.md](CHANGELOG.md); the other 71 existing live client files
are unchanged.

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
| `manifestVersion` | `5`, adding explicit partial-run provenance without relabeling retained clients. |
| `status` | `template` until a run records real values; `generated` for a captured run. |
| `captureStartedAtUtc` | Start of the complete live capture, before any request is made. |
| `generatedAtUtc` | End of the complete generation run; not earlier than any input capture. |
| `generator.bpmBaseCommit` | Immutable, reachable BPM commit SHA used as the generator source baseline. |
| `generator.bpmHeadCommit` | Immutable BPM commit whose generator tree the base-plus-patch composition must reproduce. |
| `generator.bpmBranch` | BPM branch the commit was on (informational). |
| `generator.assemblyVersion` | File version of the built `Microsoft.Azure.Workflows.CodefulSdkGenerator.dll`. |
| `generationRuns[].generator.assemblySha256` | Byte SHA-256 of the generator assembly used by both fresh runs. |
| `generationRuns[].generator.upstreamStatus` | Source publication state observed during capture, not a current remote-state claim. |
| `generationRuns[].generator.pullRequestSourceCommit` | Remote branch commit observed for the paired PR during capture. |
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
| `connectors[].runId` | Optional key into `generationRuns`; required for each client named in the current refresh. |
| `generationRuns` | Run-scoped generator, live endpoint, capture bounds, ARM-list hash, and independent validation bounds. |
| `connectors[].validation` | Independent live run ID, capture time, input hash, and output hash; must match the refreshed client. |
| `refresh` | Exact refreshed/retained inventory, retention reasons, and generator-emitted shared-file hashes. |

### Recording provenance for a run

The recipe below generates the complete manifest allowlist and populates provenance
from the actual live responses. Partial runs must not relabel untouched entries as
fresh captures. Update a fixture only when its tested contract changes; its hash is
not substituted for a missing live-input hash. Use PowerShell 7.5 or later so
`ConvertFrom-Json -DateKind String` preserves canonical timestamp strings.

The complete-run recipe below describes the schema-v4 default fields. For schema
v5 partial runs, write those values into the new run, add each refreshed entry's
`runId` and independent `validation`, and leave all default fields and retained
entries unchanged. Do not run the complete-run recipe over a partial allowlist.
Legacy `swaggerSnapshot` and
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
