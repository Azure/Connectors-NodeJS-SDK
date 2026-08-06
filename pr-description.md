**Problem:**

The TypeScript SDK generator (`DirectClientTypeScriptCodeGenerator`) iterated **all** swagger definitions when emitting types, not only those reachable from the operations selected for generation. When a version family has two siblings with different object shapes (e.g. freshservice `CreateTicket_Request` at `/api/v1/tickets` with a `helpdesk_ticket` envelope vs. `CreateTicket_RequestV2` at `/api/v2/tickets` with flat properties), version-collision resolution correctly kept only the newer sibling's operation — but the swagger still declared both definitions. Emitting both let the deprecated sibling (alphabetically first) claim the shared, version-stripped type name `CreateTicketRequest` via first-wins in `_generatedTypes`, silently dropping the current sibling's shape.

The customer symptom: `createTicketAsync` was bound to `/api/v2/tickets` (correct route), but the `CreateTicketRequest` interface it accepted carried the deprecated v1 `helpdesk_ticket` envelope — an unusable wire contract. The same pattern affected 11 connectors listed in [Azure/azure-logicapps-connector-sdk#70](https://github.com/Azure/azure-logicapps-connector-sdk/issues/70): freshservice, plumsail, office365, pipedrive, planner, trello, mailchimp, office365groupsmail, sendgrid, smtp, yammer. The C# emitter was already correct via `DirectClientCSharpGenerator.GenerateReferencedDefinitionTypes`; only the TypeScript emitter had the gap. (Python has the same bug, tracked separately in [Azure/connectors-python-sdk#66](https://github.com/Azure/connectors-python-sdk/issues/66).)

**Solution:**

Mirror the C# emitter's reachability filter in `DirectClientTypeScriptCodeGenerator.GenerateDefinitionTypes`:

1. Walk the closure of definitions referenced by the operations selected for generation (using the shared `RetainedTypeNameCoordinator.CollectReferencedDefinitions` helper) from every kept method's body and response schemas.
2. Gate **object-shape** definitions on the closure — a definition emitted as `export interface X { ... }` must be in the referenced set.
3. Continue to emit primitive aliases (`export type X = string;`) and string-enum unions (`export type X = "Red" | "Green" | "Blue";`) unconditionally. They cannot participate in the shape-collision bug because the discovery layer already collapses primitive-typed responses to the raw primitive on the method signature — narrowing the reachability gate to object shapes preserves consumer-facing typed constants and keeps all existing primitive/enum emission tests intact.
4. Continue to honor `_retainedTypeNames.IsCollapsedAway(defName)` for definitions that the retained-set decision folded into a byte-identical sibling.

Added a targeted regression test `Generate_VersionFamilyWithDifferentShapes_EmitsRetainedSiblingShapeAndSkipsDeprecatedDefinition` that reproduces the freshservice pattern (two siblings, different object shapes, only V2 operation surviving version-collision resolution) and asserts:

- The retained V2 operation `createTicketAsync` is emitted.
- The deprecated `CreateTicket_Request` `Definition:` marker is NOT emitted.
- The retained `CreateTicket_RequestV2` `Definition:` marker IS emitted.
- The `CreateTicketRequest` interface carries the V2 shape (contains `priority`).
- The `CreateTicketRequest` interface does NOT carry the deprecated V1 `helpdesk_ticket` envelope.

**Validation:**
Describe what validations are needed:
- [x] Full `CodefulSdkGenerator.Tests` suite green: **575 passed / 0 failed / 2 skipped** (2 skipped are unrelated flake8-linting tests).
- [x] New regression test `Generate_VersionFamilyWithDifferentShapes_EmitsRetainedSiblingShapeAndSkipsDeprecatedDefinition` fails on `master` and passes on this branch.
- [ ] Validated in Test Consumption Environment — N/A, generator tooling change (no runtime code path affected).
- [ ] Validated private Logic Apps Standard package — N/A, generator tooling change.
- [ ] `workflow-bpm-bundle` pipeline green on this branch — N/A, change is confined to `src/tools/CodefulSdkGenerator*`, does not touch extension packaging or either bundle builder.
- [ ] Optional "Full Test Pass" Task Required — N/A.
- [ ] Regenerate affected connector SDKs downstream: SDK-side regeneration and wire-contract verification for freshservice, plumsail, office365, pipedrive, planner, trello, mailchimp, office365groupsmail, sendgrid, smtp, yammer will happen in the [Azure/azure-logicapps-connector-sdk](https://github.com/Azure/azure-logicapps-connector-sdk) repo after this generator fix ships.

*Before submitting this PR, please make sure that you have*:
- [ ] Add component tag(s) to pull request. `SKU:Consumption`, `SKU:Standard`, `SKU:Common`, `SKU:Other`. — `SKU:Other` (generator tooling).
- [ ] Add risk tag to pull request. `Risk:None`, `Risk:Low`, `Risk:Medium`, `Risk:High`, for risk classification guidance see [R2D Risk Assessment](https://eng.ms/docs/more/sre/engagements/platform/r2d/r2dconcepts/r2d-risk-assessment) — `Risk:None` (build-time-only tooling, no runtime code path, no production surface).
- [x] Added unit tests — new regression test covers the freshservice pattern.
- [x] Validated change — full generator suite green.
- [ ] Added logging. Ensured PII is not logged — N/A, no runtime code.
- [ ] Created/Updated Alerts — N/A, no runtime code.
- [ ] Updated TSG's on Engineering Hub — N/A, no operational change.
- [ ] [Settings checklist](https://msazure.visualstudio.com/One/_git/AzureUX-BPM-EngHub?path=/documentation/EngineeringProcesses/Configuration/AppSettings.md&anchor=checklist-for-adding-a-new-consumption-setting) reviewed (if adding/modifying app settings) — N/A, no app settings added or modified.

**Release Notes for Logic Apps Standard**
Add any Standard-sku changes as a bulleted list (with dashes as bullets) between the lines below.
This will be automatically added to a changelog at release time and is public-facing. [More Info](https://aka.ms/la-releasenotes)
- [ ] Release Notes for Logic App Standard Required — Not required, generator tooling change with no Standard runtime surface.
- [ ] Release Notes reviewed by Esther (ESTFAN) — N/A.

====ChangelogStart====
====ChangelogEnd====
