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
    outputSha256: string;
}

/**
 * A trigger route the generator dropped because its simplified name collided with a kept newer version.
 */
interface ManifestDroppedTriggerRoute {
    connector: string;
    droppedOperationId: string;
    path: string;
    keptOperationId: string;
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
    routeIdentityLoss?: {
        droppedTriggerRoutes: ManifestDroppedTriggerRoute[];
    };
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

    it("should record the BPM generator commit as a 40-character hex SHA", () => {
        expect(manifest.generator.bpmCommit ?? "").toMatch(/^[0-9a-f]{40}$/);
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
            expect(fs.existsSync(path.join(RepositoryRoot, connector.outputFile))).toBe(true);
            expect(computeSha256(connector.swaggerSnapshot)).toBe(connector.swaggerSha256);
        },
    );

    it.each(connectorCases)(
        "should match the committed generated output hash for '%s'",
        (_apiName: string, connector: ManifestConnectorEntry) => {
            expect(typeof connector.outputSha256).toBe("string");
            expect(connector.outputSha256).toMatch(/^[0-9a-f]{64}$/);
            expect(fs.existsSync(path.join(RepositoryRoot, connector.outputFile))).toBe(true);
            expect(computeSha256(connector.outputFile)).toBe(connector.outputSha256);
        },
    );

    it("should be a bijection between manifest connectors and generated *Extensions.ts files", () => {
        const manifestOutputFiles = manifest.connectors
            .map(connector => connector.outputFile)
            .sort();
        const generatedExtensionFiles = fs
            .readdirSync(path.join(RepositoryRoot, "src", "generated"))
            .filter(entry => entry.endsWith("Extensions.ts"))
            .map(entry => `src/generated/${entry}`)
            .sort();

        expect(manifestOutputFiles).toEqual(generatedExtensionFiles);
    });

    it("should record any dropped trigger routes with a well-formed shape", () => {
        expect(manifest.routeIdentityLoss).toBeDefined();
        expect(Array.isArray(manifest.routeIdentityLoss?.droppedTriggerRoutes)).toBe(true);

        // NOTE(swapnilnagar): Shape-only, and an empty list is valid — a future regeneration that drops no
        // routes should still pass. Each recorded entry must be fully populated so the record cannot rot.
        for (const droppedRoute of manifest.routeIdentityLoss?.droppedTriggerRoutes ?? []) {
            expect(typeof droppedRoute.connector).toBe("string");
            expect(droppedRoute.connector.length).toBeGreaterThan(0);
            expect(typeof droppedRoute.droppedOperationId).toBe("string");
            expect(droppedRoute.droppedOperationId.length).toBeGreaterThan(0);
            expect(typeof droppedRoute.path).toBe("string");
            expect(droppedRoute.path.length).toBeGreaterThan(0);
            expect(typeof droppedRoute.keptOperationId).toBe("string");
            expect(droppedRoute.keptOperationId.length).toBeGreaterThan(0);
        }
    });
});
