---
applyTo: "src/generated/**"
---
# Generated Code Ownership and Connector Table Maintenance

Files under `src/generated/` are generator-owned artifacts. Do not edit them manually, including changes to imports, error types, methods, models, registries, or exports. Fix the BPM `CodefulSdkGenerator` when its current output is wrong, regenerate from the Swagger snapshot and generator base/head/patch recorded in `generation.manifest.json`, and update the recorded provenance and hashes. If generator access is unavailable, report the blocker instead of applying a local patch.

The TypeScript generator automatically emits each `<Connector>Extensions.ts` client plus the shared `ManagedConnectors.ts`, `connectorNames.ts`, and `index.ts` files. A filtered `--connectors` run also emits those shared files, but they contain only the filtered subset and the generator prints a partial-registry warning.

- When regenerating one existing connector without changing the connector inventory, generate into a temporary directory and replace only that connector's `*Extensions.ts` file. Do not copy the partial shared files.
- When adding, removing, or renaming a connector, regenerate with the complete connector list recorded in the `generation.manifest.json` command and replace the generated client and all shared files together.

Follow the replay workflow in `GENERATION.md`. After regeneration, compare the temporary output with the committed artifact using `git diff --no-index -- <generated-output> src/generated/<file>` and require no differences. Then run `npm test -- --runInBand tests/generationManifest.test.ts`.

When a new connector is added to the `generated/` folder, update the supported SDK connector names list in `.github/skills/connection-setup/SKILL.md` (Step 2). Add the new connector's API name (e.g., `office365`, `sharepointonline`) to the inline list.

Also update the validated connectors table in `README.md` if the connector has been validated end-to-end.
