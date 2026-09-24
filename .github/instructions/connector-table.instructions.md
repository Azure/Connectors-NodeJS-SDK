---
applyTo: "src/generated/**"
---
# Generated Code Ownership and Connector Table Maintenance

Files under `src/generated/` are generator-owned artifacts. Do not edit them manually, including changes to imports, error types, methods, models, registries, or exports. Fix the BPM `CodefulSdkGenerator` when its current output is wrong, regenerate from the Swagger snapshot and generator base/head/patch recorded in `generation.manifest.json`, and update the recorded provenance and hashes. If generator access is unavailable, report the blocker instead of applying a local patch.

Follow the replay workflow in `GENERATION.md`. After regeneration, compare the temporary output with the committed artifact using `git diff --no-index -- <generated-output> src/generated/<file>` and require no differences. Then run `npm test -- --runInBand tests/generationManifest.test.ts`.

When a new connector is added to the `generated/` folder, update the supported SDK connector names list in `.github/skills/connection-setup/SKILL.md` (Step 2). Add the new connector's API name (e.g., `office365`, `sharepointonline`) to the inline list.

Also update the validated connectors table in `README.md` if the connector has been validated end-to-end.
