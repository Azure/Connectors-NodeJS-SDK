// Copyright (c) Microsoft Corporation.  All rights reserved.

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const RepositoryRoot = process.cwd();
const ManifestPath = path.join(RepositoryRoot, "generation.manifest.json");

/**
 * A single connector provenance entry recorded in the generation manifest.
 */
interface ManifestConnectorEntry {
    apiName: string;
    outputFile: string;
    swaggerSnapshot: string;
    swaggerSha256: string;
}

/**
 * The provenance record persisted in generation.manifest.json.
 */
interface GenerationManifest {
    status: string;
    generator: {
        bpmCommit: string | null;
    };
    connectors: ManifestConnectorEntry[];
}

/**
 * Reads and parses the generation manifest from the repository root.
 */
function loadManifest(): GenerationManifest {
    return JSON.parse(fs.readFileSync(ManifestPath, "utf8")) as GenerationManifest;
}

/**
 * Computes the lowercase hex SHA-256 of the file at the given repository-relative path.
 */
function computeSha256(relativePath: string): string {
    return createHash("sha256")
        .update(fs.readFileSync(path.join(RepositoryRoot, relativePath)))
        .digest("hex");
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe("generation.manifest.json provenance", () => {
    const manifest = loadManifest();

    it("should mark the run as generated", () => {
        expect(manifest.status).toBe("generated");
    });

    it("should record a non-empty BPM generator commit", () => {
        expect(typeof manifest.generator.bpmCommit).toBe("string");
        expect((manifest.generator.bpmCommit ?? "").length).toBeGreaterThan(0);
    });

    it("should list at least one connector", () => {
        expect(manifest.connectors.length).toBeGreaterThan(0);
    });

    const connectorCases: Array<[string, ManifestConnectorEntry]> = manifest.connectors.map(
        connector => [connector.apiName, connector],
    );

    it.each(connectorCases)(
        "should match the committed swagger snapshot hash for '%s'",
        (_apiName: string, connector: ManifestConnectorEntry) => {
            expect(fs.existsSync(path.join(RepositoryRoot, connector.swaggerSnapshot))).toBe(true);
            expect(computeSha256(connector.swaggerSnapshot)).toBe(connector.swaggerSha256);
        },
    );
});
