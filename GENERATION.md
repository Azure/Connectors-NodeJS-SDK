# Connector Code Generation

This document describes how to generate typed connector clients using the `LogicAppsCompiler` CLI tool.

## Overview

The **CodefulSdkGenerator** tool generates typed TypeScript clients from managed connector swagger definitions. The generated code provides:

- **Type-safe interfaces** - Input/output types with JSDoc documentation
- **Typed client classes** - Async methods for each connector action extending `ConnectorClientBase`
- **Authentication handling** - Built-in token acquisition for API Hub via `TokenProvider`

## Prerequisites

### Tools Required

1. **ARMClient** - For authenticated Azure Resource Manager API calls
   - Install via Chocolatey: `choco install armclient`
   - Install via WinGet: `winget install projectkudu.ARMClient`
   - The generator defaults to `C:\ProgramData\chocolatey\bin\ARMClient.exe`
   - **If ARMClient is installed elsewhere** (e.g., via WinGet), set the `ARMCLIENT_PATH` environment variable

2. **Azure Subscription** - Access to an Azure subscription with Logic Apps Standard

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
LogicAppsCompiler.exe <output-directory> unused --directClientTypeScript

# Generate specific connectors only
LogicAppsCompiler.exe <output-directory> unused --directClientTypeScript --connectors=office365

# Equivalent older syntax (depending on LogicAppsCompiler version)
LogicAppsCompiler.exe <output-directory> unused --directClient --language=typescript --connectors=office365

# Example: Generate to this SDK repo's generated folder
LogicAppsCompiler.exe "<path-to-Connectors-NodeJS-SDK>/src/generated" unused --directClientTypeScript --connectors=office365
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
- If ARMClient is not installed at the default Chocolatey path, set
   `ARMCLIENT_PATH` before running generation.

## Post-Generation Validation

Run these checks from the `Connectors-NodeJS-SDK` repo root:

```powershell
npm run build
npm run typecheck
npm test
npm run typecheck:samples
```
