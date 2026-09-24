---
applyTo: "src/generated/**"
---
# Generated Code Ownership and Connector Table Maintenance

Files under `src/generated/` are generator-owned artifacts. Do not edit them manually, including changes to imports, error types, methods, models, registries, or exports. Fix the BPM `CodefulSdkGenerator` when its current output is wrong, regenerate from pinned Swagger, and update `generation.manifest.json` provenance and hashes. If generator access is unavailable, report the blocker instead of applying a local patch.

After regeneration, verify the committed generated files are byte-identical to generator output and run the manifest tests.

When a new connector is added to the `generated/` folder, update the supported SDK connector names list in `.github/skills/connection-setup/SKILL.md` (Step 2). Add the new connector's API name (e.g., `office365`, `sharepointonline`) to the inline list.

Also update the validated connectors table in `README.md` if the connector has been validated end-to-end.
