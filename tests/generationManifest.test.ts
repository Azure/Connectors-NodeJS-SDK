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
 * A trigger operation and its normalized route from a pinned Swagger snapshot.
 */
interface SwaggerTriggerRoute {
    operationId: string;
    path: string;
}

/**
 * The provenance record persisted in generation.manifest.json.
 */
interface GenerationManifest {
    manifestVersion: number;
    status: string;
    generator: {
        bpmBaseCommit: string | null;
        sourcePatch: {
            path: string;
            sha256: string;
        };
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
 * Computes the lowercase hex SHA-256 of UTF-8 text after normalizing CRLF line endings to LF.
 */
function computeCanonicalTextSha256(relativePath: string): string {
    const canonicalContent = fs
        .readFileSync(path.join(RepositoryRoot, relativePath), "utf8")
        .replace(/\r\n/g, "\n");

    return createHash("sha256")
        .update(canonicalContent, "utf8")
        .digest("hex");
}

/**
 * Reads trigger operation IDs and routes from a pinned connector Swagger snapshot.
 */
function loadSwaggerTriggerRoutes(swaggerSnapshot: string): SwaggerTriggerRoute[] {
    const swagger = JSON.parse(
        fs.readFileSync(path.join(RepositoryRoot, swaggerSnapshot), "utf8"),
    ) as {
        paths: Record<string, Record<string, Record<string, unknown>>>;
    };
    const httpMethods = new Set(["delete", "get", "head", "options", "patch", "post", "put", "trace"]);
    const triggerRoutes = new Array<SwaggerTriggerRoute>();

    for (const [swaggerPath, pathItem] of Object.entries(swagger.paths)) {
        for (const [method, operation] of Object.entries(pathItem)) {
            if (!httpMethods.has(method.toLowerCase()) || operation["x-ms-trigger"] === undefined) {
                continue;
            }

            const operationId = operation.operationId;
            if (typeof operationId === "string") {
                triggerRoutes.push({
                    operationId,
                    path: swaggerPath.replace(/^\/\{connectionId\}/, ""),
                });
            }
        }
    }

    return triggerRoutes;
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe("generation.manifest.json provenance", () => {
    const manifest = loadManifest();

    it("should mark the run as generated", () => {
        expect(manifest.status).toBe("generated");
    });

    it("should use the source-patch-aware manifest schema", () => {
        expect(manifest.manifestVersion).toBe(2);
    });

    it("should record the BPM generator base commit as a 40-character hex SHA", () => {
        expect(manifest.generator.bpmBaseCommit ?? "").toMatch(/^[0-9a-f]{40}$/);
    });

    it("should match the recorded generator source patch hash", () => {
        expect(manifest.generator.sourcePatch.path).toBeTruthy();
        expect(manifest.generator.sourcePatch.sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(fs.existsSync(path.join(RepositoryRoot, manifest.generator.sourcePatch.path))).toBe(true);
        expect(computeCanonicalTextSha256(manifest.generator.sourcePatch.path))
            .toBe(manifest.generator.sourcePatch.sha256);
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
            expect(computeCanonicalTextSha256(connector.swaggerSnapshot)).toBe(connector.swaggerSha256);
        },
    );

    it.each(connectorCases)(
        "should match the committed generated output hash for '%s'",
        (_apiName: string, connector: ManifestConnectorEntry) => {
            expect(typeof connector.outputSha256).toBe("string");
            expect(connector.outputSha256).toMatch(/^[0-9a-f]{64}$/);
            expect(fs.existsSync(path.join(RepositoryRoot, connector.outputFile))).toBe(true);
            expect(computeCanonicalTextSha256(connector.outputFile)).toBe(connector.outputSha256);
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

    it("should match dropped and kept trigger routes to the pinned swagger snapshots", () => {
        expect(manifest.routeIdentityLoss).toBeDefined();
        expect(Array.isArray(manifest.routeIdentityLoss?.droppedTriggerRoutes)).toBe(true);

        for (const droppedRoute of manifest.routeIdentityLoss?.droppedTriggerRoutes ?? []) {
            const connector = manifest.connectors.find(entry => entry.apiName === droppedRoute.connector);
            if (connector === undefined) {
                throw new Error(`Connector '${droppedRoute.connector}' is missing from the generation manifest.`);
            }

            const triggerRoutes = loadSwaggerTriggerRoutes(connector.swaggerSnapshot);
            const droppedMatches = triggerRoutes.filter(
                triggerRoute => triggerRoute.operationId === droppedRoute.droppedOperationId,
            );
            const keptMatches = triggerRoutes.filter(
                triggerRoute => triggerRoute.operationId === droppedRoute.keptOperationId,
            );

            expect(droppedMatches).toEqual([{
                operationId: droppedRoute.droppedOperationId,
                path: droppedRoute.path,
            }]);
            expect(keptMatches).toHaveLength(1);
            expect(keptMatches[0].path).toMatch(/^\//);
        }
    });
});
