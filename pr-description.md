# Phase 3 & 4 SDK expansion — 22 new connectors

## Description

Adds **22 new managed-connector clients** to the Azure Logic Apps Connectors SDK for TypeScript — the Phase 3 and Phase 4 connector rollout, mirroring the Python SDK's Phase 3 and Phase 4 sets (planning issues `Azure/azure-functions-bucees-planning#1149` and `#1150`). Each connector ships with a generated typed async client, a swagger provenance snapshot, a Jest suite, and ESM + CJS samples in both TypeScript and generated JavaScript. Generated clients under `src/generated/` are committed unedited from the AzureUX-BPM `CodefulSdkGenerator` (`--directClient --language=typescript`).

**Phase 3 (11):** Azure Event Grid (`azureeventgrid`), Azure IoT Central (`azureiotcentral`), Cloudmersive Document Conversion (`cloudmersiveconvert`), Fin & Ops Apps / Dynamics 365 (`dynamicsax`), PDF.co (`pdfco`), Plumsail Documents (`plumsail`), SQL Server (`sql`), Zendesk (`zendesk`), Pipedrive (`pipedrive`), DocuWare (`docuware`), SigningHub (`signinghub`).

**Phase 4 (11):** Campfire (`campfire`), ClickSend SMS (`clicksendsms`), Freshservice (`freshservice`), Infusionsoft (`infusionsoft`), Insightly (`insightly`), Mailchimp (`mailchimp`), Monday (`monday`), Projectplace (`projectplace`), SendGrid (`sendgrid`), Text Request (`textrequest`), Webex (`webex`).

**Scope notes**

- **Universal Print** (listed in the Python Phase 3 set) is intentionally **not included** — it is not present in the `westus` `managedApis` catalog for the generation subscription, so it cannot be generated from the same regional source used for every other connector.
- **Monday** uses the `monday` managed API.

## Paired Generator PR

- **No generator changes required.**
- Generated with AzureUX-BPM `CodefulSdkGenerator` at commit `732a35b8cce5` (assembly `1.186.0.23`) — the same generator revision already recorded for the 30-connector Phase 2 surface. The existing 30 clients regenerate **byte-identically**, so this PR is strictly additive.

## Changes

- **Generated clients (22 new):** `src/generated/{Connector}Extensions.ts`, committed unedited.
- **Registries:** regenerated `connectorNames.ts`, `ManagedConnectors.ts`, and `index.ts` to include all **52** connectors.
- **Provenance:** captured 22 swagger snapshots under `swagger-cache/` and added their entries — with verified `swaggerSha256` / `outputSha256` — to `generation.manifest.json` (52 connectors total). Recorded the one new trigger route-identity loss surfaced by this generation: Zendesk `GetOnUpdatedItems` → `GetOnUpdatedItemsV2` (the Azure IoT Central and SQL version-collision drops are actions, not triggers, so they are not recorded).
- **Tests (22 new):** `tests/{connector}Client.test.ts` — constructor validation, a mocked success path (HTTP verb, `Authorization` header, deserialized response), a mocked `ConnectorException` path (status code + response body), and connector-registry assertions. Azure Event Grid is trigger-only, so its suite covers the constructor + registry surface.
- **Samples (22 × 4 = 88):** ESM and CJS TypeScript samples under `samples/esm/typescript/` and `samples/cjs/typescript/`, plus their generated `.mjs` / `.cjs` counterparts.
- **Docs:** README connector table (+22 rows) and totals; CHANGELOG Phase 3 & 4 entries; connection-setup skill supported-connector list (now 52). Updated the hardcoded registry count (30 → 52) in `connectorNames.test.ts` and `managedConnectors.test.ts`.
- **Security:** ran `npm audit fix` to remediate the two pre-existing high-severity transitive **dev-dependency** advisories (`brace-expansion`, `js-yaml`). `package-lock.json`-only change (no `package.json`, `overrides`, or runtime-dependency change); `npm audit` now reports 0 vulnerabilities.

## Testing

- [x] Unit tests added/updated — 22 new connector suites (152 new tests)
- [x] All existing tests pass (`npm test`) — **64 suites, 849 tests passing**
- [x] `npm run typecheck` clean; samples `tsc --noEmit -p samples/tsconfig.json` exits 0
- [x] Generation-manifest guard passes for all 52 connectors (committed swagger and output hashes verified)
- [x] JavaScript sample-generation consistency test passes (committed `.mjs` / `.cjs` reproduce the generator output)
- [x] `npm audit` reports **0 vulnerabilities** (the two pre-existing high-severity dev-dependency advisories are fixed — see below); `npm run lint` clean

## Reviewer notes — confirmed generator behaviors

These items were raised in review. Each is an intended behavior of the pinned generator, confirmed against the committed artifacts in this PR — no code change is required or made.

- **Multipart/form-data operations are intentionally omitted.** `ConnectorClientBase` cannot compose multipart payloads, so the generator excludes routes that declare `multipart/form-data`. In the committed swagger snapshots this affects **67 of 128 Cloudmersive Document Conversion operations** and **5 of 21 DocuWare operations**. DocuWare's `DeleteFile` is one of those 5 — its `consumes` is `multipart/form-data`, so it is omitted for the multipart reason (it is not marked `deprecated` in the pinned swagger). Adding multipart support would require a generator / `ConnectorClientBase` change and is out of scope here.
- **Version collapsing is the intended public surface for Azure IoT Central and SQL Server.** Where a version family collapses to the same simplified name, the generator keeps the newest route (e.g., IoT Central `Devices_Get` → `Devices_Get_V1`, `Devices_Set` → `Devices_Set_V2`; SQL `ExecuteProcedure` → `ExecuteProcedure_V2`) and one canonical trigger per name, dropping superseded preview/legacy/duplicate routes. The single **trigger** route-identity loss (Zendesk `GetOnUpdatedItems` → `GetOnUpdatedItemsV2`) is recorded in `generation.manifest.json`; the IoT Central and SQL drops are **actions**, so they surface via the generator's version-collision warnings rather than the trigger-route ledger.
- **Parity-validator model-type warnings for Insightly, Mailchimp, and SigningHub are normalization artifacts, not contract defects.** The generated fields reference the normalized swagger definitions: Insightly `Task` → `TaskObject` (8 references), Mailchimp `SettingsV2` → `Settings` (interface present), SigningHub `HandSignature` (referenced integer enum, 9 references). The validator flags the renames; the emitted types match the pinned swagger.
- **The two `npm audit` high-severity findings are resolved in this PR.** They were pre-existing transitive **dev-dependency** advisories (`brace-expansion`, reached via the eslint/jest/ts-jest tooling; and `js-yaml`, reached via the istanbul coverage chain) — not runtime dependencies and not introduced by the connector work. `npm audit fix` remediated both within existing semver ranges: a **`package-lock.json`-only** change (no `package.json`, `overrides`, or runtime-dependency change). `npm audit` now reports **0 vulnerabilities**, and build, typecheck, lint, and the full test suite continue to pass.

## Checklist

- [x] Code follows the project's [coding conventions](copilot-instructions.md)
- [x] `src/generated/` contains **generator output only** (produced by `CodefulSdkGenerator`, not hand-edited); the change is additive and leaves the existing 30 clients byte-identical
- [x] Documentation updated (README, connection-setup skill)
- [x] CHANGELOG.md updated
