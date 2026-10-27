// Copyright (c) Microsoft Corporation.  All rights reserved.

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const RepositoryRoot = process.cwd();
const ManifestPath = path.join(RepositoryRoot, "generation.manifest.json");
const GenerationGuidePath = path.join(RepositoryRoot, "GENERATION.md");

/**
 * A single connector provenance entry recorded in the generation manifest.
 */
interface ManifestConnectorEntry {
    apiName: string;
    outputFile: string;
    swaggerFixture: string;
    swaggerFixtureSha256: string;
    swaggerInputSha256: string;
    capturedAtUtc: string;
    outputSha256: string;
    runId?: string;
    validation?: {
        runId: string;
        capturedAtUtc: string;
        swaggerInputSha256: string;
        outputSha256: string;
    };
    generatorCommit?: string;
    sourcePatch?: {
        path: string;
        sha256: string;
    };
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
    captureStartedAtUtc: string;
    generatedAtUtc: string;
    generator: {
        bpmBaseCommit: string | null;
        bpmHeadCommit: string | null;
        assemblyVersion: string | null;
        sourcePatch?: {
            path: string;
            sha256: string;
        };
    };
    connectors: ManifestConnectorEntry[];
    generationRuns: Record<string, GenerationRun>;
    refresh: {
        runId: string;
        refreshedConnectors: string[];
        retainedConnectors: Array<{ apiName: string; reason: string }>;
        sharedFiles: Array<{ outputFile: string; outputSha256: string }>;
    };
    blockedConnectors: Array<{
        apiName: string;
        errorCode: string;
        httpStatusCode: number;
        regions: string[];
        issue: string;
    }>;
    routeIdentityLoss?: {
        droppedTriggerRoutes: ManifestDroppedTriggerRoute[];
    };
}

/**
 * Source and capture bounds for a partial refresh and its independent live validation.
 */
interface GenerationRun {
    captureStartedAtUtc: string;
    generatedAtUtc: string;
    generator: GenerationManifest["generator"] & {
        assemblySha256: string;
        upstreamStatus: string;
        pullRequest?: string;
        pullRequestSourceCommit?: string;
    };
    swaggerSource: { kind: string; subscriptionId: string; location: string; apiVersion: string };
    connectorListInputSha256: string;
    validation: { runId: string; captureStartedAtUtc: string; generatedAtUtc: string; connectorListInputSha256: string };
}

/**
 * Rejects incomplete or inconsistent source composition for a partial run.
 */
function validateRunSource(run: GenerationRun): void {
    const generator = run.generator;
    if (!/^[0-9a-f]{40}$/.test(generator.bpmBaseCommit ?? "") ||
        !/^[0-9a-f]{40}$/.test(generator.bpmHeadCommit ?? "") ||
        !/^\d+\.\d+\.\d+\.\d+$/.test(generator.assemblyVersion ?? "") ||
        (generator.sourcePatch === undefined && generator.bpmBaseCommit !== generator.bpmHeadCommit)) {
        throw new Error("Run generator source composition is incomplete.");
    }

    if (generator.sourcePatch !== undefined &&
        (generator.bpmBaseCommit === generator.bpmHeadCommit ||
        !path.basename(generator.sourcePatch.path).startsWith(generator.bpmHeadCommit!.slice(0, 7) + "-") ||
        !/^[0-9a-f]{64}$/.test(generator.sourcePatch.sha256) ||
        computeCanonicalTextSha256(generator.sourcePatch.path) !== generator.sourcePatch.sha256)) {
        throw new Error("Run source patch does not match its recorded head or hash.");
    }

    if (generator.sourcePatch !== undefined) {
        const patch = fs.readFileSync(path.join(RepositoryRoot, generator.sourcePatch.path), "utf8").replace(/\r\n/g, "\n");
        const sections = patch.split(/(?=^diff --git )/gm).filter(section => section.startsWith("diff --git "));
        const paths = sections.map(section => {
            const header = section.match(/^diff --git a\/(.+) b\/(.+)$/m);
            if (header === null || header[1] !== header[2] ||
                !/^src\/tools\/CodefulSdkGenerator(?:\.Tests)?\//.test(header[2])) {
                throw new Error("Run patch must contain only generator and generator-test source paths.");
            }

            return header[2];
        });
        if (paths.length === 0 || new Set(paths).size !== paths.length ||
            !paths.some(changedPath => changedPath.includes("CodefulSdkGenerator.Tests/")) ||
            !paths.some(changedPath => changedPath.includes("DirectClient/"))) {
            throw new Error("Run patch must include generator behavior and its tests without duplicate paths.");
        }
    }
}

/**
 * Requires each refreshed connector to match its own run and independent live validation.
 */
function validateConnectorRun(manifest: GenerationManifest, connector: ManifestConnectorEntry): void {
    if (connector.runId === undefined) {
        if (manifest.refresh.refreshedConnectors.includes(connector.apiName)) {
            throw new Error("A refreshed connector must identify its live run.");
        }

        validateCaptureWindow(manifest.captureStartedAtUtc, manifest.generatedAtUtc, connector.capturedAtUtc);
        return;
    }

    const run = manifest.generationRuns[connector.runId];
    const validation = connector.validation;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(connector.runId) ||
        run === undefined || connector.runId !== manifest.refresh.runId ||
        !manifest.refresh.refreshedConnectors.includes(connector.apiName) ||
        validation === undefined || validation.runId !== run.validation.runId ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(validation.runId) ||
        validation.runId === connector.runId ||
        validation.swaggerInputSha256 !== connector.swaggerInputSha256 ||
        validation.outputSha256 !== connector.outputSha256 ||
        connector.generatorCommit !== undefined || connector.sourcePatch !== undefined) {
        throw new Error("Connector provenance does not match its live run and independent validation.");
    }

    validateRunSource(run);
    validateCaptureWindow(run.captureStartedAtUtc, run.generatedAtUtc, connector.capturedAtUtc);
    validateCaptureWindow(run.validation.captureStartedAtUtc, run.validation.generatedAtUtc, validation.capturedAtUtc);
    if (parseUtcTimestamp(run.validation.captureStartedAtUtc) < parseUtcTimestamp(run.generatedAtUtc)) {
        throw new Error("Independent validation must start after generation completes.");
    }
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
 * Parses a canonical UTC timestamp without accepting normalized invalid calendar dates.
 */
function parseUtcTimestamp(value: unknown): number {
    if (typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
        throw new Error("Manifest timestamps must use canonical UTC ISO 8601 with millisecond precision.");
    }

    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) {
        throw new Error("Manifest timestamp contains an invalid calendar date.");
    }

    return timestamp;
}

/**
 * Requires an actual input capture to fall within this complete live generation run.
 */
function validateCaptureWindow(start: unknown, end: unknown, captured: unknown): void {
    const startedAt = parseUtcTimestamp(start);
    const generatedAt = parseUtcTimestamp(end);
    const capturedAt = parseUtcTimestamp(captured);
    if (startedAt > generatedAt || generatedAt > Date.now() ||
        capturedAt < startedAt || capturedAt > generatedAt) {
        throw new Error("Connector input capture must fall within the nonfuture generation window.");
    }
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

    it("should use the verified source-composition manifest schema", () => {
        expect(manifest.manifestVersion).toBe(5);
    });

    it.each(manifest.connectors)("should record bounded live input capture metadata for $apiName", connector => {
        expect(connector.swaggerInputSha256).toMatch(/^[0-9a-f]{64}$/);
        validateConnectorRun(manifest, connector);
        expect(connector).not.toHaveProperty("swaggerSnapshot");
        expect(connector).not.toHaveProperty("swaggerSha256");
    });

    it.each([
        "", null, "not-a-date", "2026-02-30T10:00:00.000Z",
        "2026-01-01T10:00:00.000+01:00", "2026-01-01T10:00:00Z",
    ])("should reject invalid UTC timestamps: %s", value => {
        expect(() => parseUtcTimestamp(value)).toThrow();
    });

    it.each([
        "2026-01-01T09:59:59.999Z", "2026-01-01T10:10:00.001Z",
    ])("should reject stale or later-than-generation captures: %s", captured => {
        expect(() => validateCaptureWindow(
            "2026-01-01T10:00:00.000Z", "2026-01-01T10:10:00.000Z", captured,
        )).toThrow();
    });

    it("should accept valid capture boundaries", () => {
        for (const captured of ["2026-01-01T10:00:00.000Z", "2026-01-01T10:10:00.000Z"]) {
            expect(() => validateCaptureWindow(
                "2026-01-01T10:00:00.000Z", "2026-01-01T10:10:00.000Z", captured,
            )).not.toThrow();
        }
    });

    it("should reject future and reversed generation windows", () => {
        const future = new Date(Date.now() + 60000).toISOString();
        expect(() => validateCaptureWindow(future, future, future)).toThrow();
        expect(() => validateCaptureWindow(
            "2026-01-01T10:10:00.000Z", "2026-01-01T10:00:00.000Z",
            "2026-01-01T10:05:00.000Z",
        )).toThrow();
    });

    it("should record BPM generator base and head commits matching the composition", () => {
        expect(manifest.generator.bpmBaseCommit ?? "").toMatch(/^[0-9a-f]{40}$/);
        expect(manifest.generator.bpmHeadCommit ?? "").toMatch(/^[0-9a-f]{40}$/);
        if (manifest.generator.sourcePatch === undefined) {
            expect(manifest.generator.bpmHeadCommit).toBe(manifest.generator.bpmBaseCommit);
        } else {
            expect(manifest.generator.bpmHeadCommit).not.toBe(manifest.generator.bpmBaseCommit);
        }
    });

    it("should record a concrete four-part generator assembly version", () => {
        expect(manifest.generator.assemblyVersion ?? "").toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    });

    it("should match the recorded generator source patch hash when present", () => {
        if (manifest.generator.sourcePatch === undefined) {
            return;
        }

        expect(manifest.generator.sourcePatch.path).toBeTruthy();
        expect(manifest.generator.sourcePatch.sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(fs.existsSync(path.join(RepositoryRoot, manifest.generator.sourcePatch.path))).toBe(true);
        expect(computeCanonicalTextSha256(manifest.generator.sourcePatch.path))
            .toBe(manifest.generator.sourcePatch.sha256);
    });

    it("should bind a recorded generator patch to its head and source paths", () => {
        if (manifest.generator.sourcePatch === undefined) {
            return;
        }

        const patchName = path.basename(manifest.generator.sourcePatch.path);
        const headPrefix = patchName.match(/^([0-9a-f]{7,40})-/)?.[1];
        expect(headPrefix).toBeDefined();
        expect(manifest.generator.bpmHeadCommit?.startsWith(headPrefix!)).toBe(true);

        const patch = fs.readFileSync(
            path.join(RepositoryRoot, manifest.generator.sourcePatch.path),
            "utf8",
        ).replace(/\r\n/g, "\n");
        const patchSections = patch
            .split(/(?=^diff --git )/gm)
            .filter(section => section.startsWith("diff --git "));
        const changedPaths = patchSections.map(section => {
            const header = section.match(/^diff --git a\/(.+) b\/(.+)$/m);
            expect(header).not.toBeNull();
            expect(header![1]).toBe(header![2]);

            const changedPath = header![2];
            const isAdded = /^new file mode \d+$/m.test(section);
            const isDeleted = /^deleted file mode \d+$/m.test(section);
            expect(Number(isAdded) + Number(isDeleted)).toBeLessThanOrEqual(1);
            if (isAdded) {
                expect(section).toContain("--- /dev/null");
                expect(section).toContain(`+++ b/${changedPath}`);
            } else if (isDeleted) {
                expect(section).toContain(`--- a/${changedPath}`);
                expect(section).toContain("+++ /dev/null");
            } else {
                expect(section).toContain(`--- a/${changedPath}`);
                expect(section).toContain(`+++ b/${changedPath}`);
            }

            return changedPath;
        });
        expect(changedPaths.length).toBeGreaterThan(0);
        expect(new Set(changedPaths).size).toBe(changedPaths.length);
        expect(changedPaths.every(changedPath =>
            changedPath.startsWith("src/tools/CodefulSdkGenerator"),
        )).toBe(true);
        expect(changedPaths.some(changedPath => changedPath.includes("CodefulSdkGenerator.Tests/"))).toBe(true);
        expect(changedPaths.some(changedPath => changedPath.includes("DirectClient/"))).toBe(true);
    });

    it("should capture source identity before checking out the provenance base", () => {
        const generationGuide = fs.readFileSync(GenerationGuidePath, "utf8").replace(/\r\n/g, "\n");
        const headCaptureIndex = generationGuide.indexOf("$sourceHeadCommit = (git -C $bpmRepoRoot rev-parse HEAD)");
        const branchCaptureIndex = generationGuide.indexOf("$sourceBranch = (git -C $bpmRepoRoot branch --show-current)");
        const baseCheckoutIndex = generationGuide.indexOf("git -C $bpmRepoRoot checkout $manifest.generator.bpmBaseCommit");

        expect(headCaptureIndex).toBeGreaterThan(-1);
        expect(branchCaptureIndex).toBeGreaterThan(-1);
        expect(baseCheckoutIndex).toBeGreaterThan(branchCaptureIndex);
        expect(generationGuide).toContain("$manifest.generator.bpmHeadCommit = $sourceHeadCommit");
        expect(generationGuide).toContain("$manifest.generator.bpmBranch = $sourceBranch");
        expect(generationGuide).toContain("git -C $bpmRepoRoot checkout $sourceHeadCommit");
        expect(generationGuide).toContain("$manifest.generator.bpmBaseCommit = $sourceHeadCommit");
        expect(generationGuide).not.toContain("$manifest.generator.bpmHeadCommit = (git -C $bpmRepoRoot rev-parse HEAD)");
    });

    it("should list at least one connector", () => {
        expect(manifest.connectors.length).toBeGreaterThan(0);
    });

    it("should refresh 98 connectors and retain only Orderful with its original provenance", () => {
        expect(manifest.connectors).toHaveLength(99);
        expect(manifest.refresh.refreshedConnectors).toHaveLength(98);
        expect(new Set(manifest.refresh.refreshedConnectors).size).toBe(98);
        expect(manifest.refresh.refreshedConnectors.slice().sort()).toEqual(
            manifest.connectors.filter(connector => connector.apiName !== "orderful").map(connector => connector.apiName).sort(),
        );
        expect(manifest.refresh.retainedConnectors).toHaveLength(1);
        expect(manifest.refresh.retainedConnectors[0].apiName).toBe("orderful");
        expect(manifest.refresh.retainedConnectors[0].reason).toContain("ApiNotFound");
        const retained = manifest.connectors.find(connector => connector.apiName === "orderful")!;
        expect(retained.runId).toBeUndefined();
        expect(retained.validation).toBeUndefined();
        expect(retained.generatorCommit).toBeUndefined();
        expect(retained.sourcePatch).toBeUndefined();
        expect(retained.capturedAtUtc).toBe("2026-10-08T23:40:06.593Z");
        expect(retained.outputSha256).toBe("847421915c1cb5ab7cd35df65354dcb5edb86f7f9359b4fb86a1fa290d7655e1");
        expect(retained.swaggerInputSha256).toBe("b8382ee707badc592068578bcb292639aca3bbbaec050e877f343a95ea4a26ba");
        expect(manifest.generator.bpmBaseCommit).toBe("7c26edf742318d57c473947e02a006487582c8fd");
        expect(manifest.generator.bpmHeadCommit).toBe(manifest.generator.bpmBaseCommit);
        expect(manifest.refresh.sharedFiles.map(file => file.outputFile).sort()).toEqual([
            "src/generated/ManagedConnectors.ts", "src/generated/connectorNames.ts", "src/generated/index.ts",
        ]);
        for (const file of manifest.refresh.sharedFiles) {
            expect(computeCanonicalTextSha256(file.outputFile)).toBe(file.outputSha256);
        }
    });

    it("should retain the historical unpushed source and paired PR capture without relabeling it", () => {
        const run = manifest.generationRuns["65391f59-b383-4d89-b912-5c90cc89f423"];
        validateRunSource(run);
        expect(run.generator.bpmBaseCommit).toBe("e2d2073a07d88d1fbb1a65a61df27b41b0ed5627");
        expect(run.generator.bpmHeadCommit).toBe("ae43130532c83c922aea4ad9d39bc44a86f71f5c");
        expect(run.generator.assemblySha256).toMatch(/^[0-9a-f]{64}$/);
        expect(run.generator.upstreamStatus).toBe("local-committed-unpushed");
        expect(run.generator.pullRequest).toContain("17586353");
        expect(run.generator.pullRequestSourceCommit).toBe("c995a1a7cf144f9211305f078ec5610938872321");
        expect(run.swaggerSource.kind).toBe("live-arm-metadata");
        expect(run.swaggerSource.subscriptionId).toMatch(/^[0-9a-f-]{36}$/);
        expect(run.swaggerSource.location).toBe("westus");
        expect(run.swaggerSource.apiVersion).toBe("2018-07-01-preview");
        expect(run.connectorListInputSha256).toMatch(/^[0-9a-f]{64}$/);
        expect(run.validation.connectorListInputSha256).toBe(run.connectorListInputSha256);
    });

    it("should bind the current live run to merged source and independent validation", () => {
        const run = manifest.generationRuns[manifest.refresh.runId];
        validateRunSource(run);
        expect(run.generator.bpmBaseCommit).toBe("21a5e28e029a1e58304b3c4d66302cbb528ed1fd");
        expect(run.generator.bpmHeadCommit).toBe(run.generator.bpmBaseCommit);
        expect(run.generator.sourcePatch).toBeUndefined();
        expect(run.generator.upstreamStatus).toBe("merged");
        expect(run.generator.assemblySha256).toMatch(/^[0-9a-f]{64}$/);
        expect(run.swaggerSource).toEqual({
            kind: "live-arm-metadata",
            subscriptionId: "1a839f1f-10b2-4613-95ad-0800a22abbf2",
            location: "westus",
            apiVersion: "2018-07-01-preview",
        });
        expect(run.connectorListInputSha256).toMatch(/^[0-9a-f]{64}$/);
        expect(run.validation.connectorListInputSha256).toBe(run.connectorListInputSha256);
    });

    it("should track unavailable additions without shipping fixture-backed replacements", () => {
        expect(manifest.blockedConnectors.map(connector => connector.apiName).sort()).toEqual([
            "onedrive", "universalprint",
        ]);
        for (const blocked of manifest.blockedConnectors) {
            expect(blocked.errorCode).toBe("ApiNotFound");
            expect(blocked.httpStatusCode).toBe(404);
            expect(blocked.regions).toEqual(["westus", "eastus", "westcentralus", "westeurope"]);
            expect(blocked.issue).toBe("https://github.com/Azure/Connectors-NodeJS-SDK/issues/117");
            expect(manifest.connectors.some(connector => connector.apiName === blocked.apiName)).toBe(false);
        }
    });

    it.each(["missing-run", "unknown-run", "stale-capture", "validation-run", "validation-input", "validation-output", "validation-stale", "old-source"])(
        "should reject false per-connector freshness: %s", mutation => {
            const changed = structuredClone(manifest);
            const connector = changed.connectors.find(entry => entry.apiName === "arm")!;
            if (mutation === "missing-run") delete connector.runId;
            if (mutation === "unknown-run") connector.runId = "unknown";
            if (mutation === "stale-capture") connector.capturedAtUtc = manifest.connectors.find(entry => entry.apiName === "orderful")!.capturedAtUtc;
            if (mutation === "validation-run") connector.validation!.runId = connector.runId!;
            if (mutation === "validation-input") connector.validation!.swaggerInputSha256 = "0".repeat(64);
            if (mutation === "validation-output") connector.validation!.outputSha256 = "0".repeat(64);
            if (mutation === "validation-stale") connector.validation!.capturedAtUtc = connector.capturedAtUtc;
            if (mutation === "old-source") connector.generatorCommit = manifest.generator.bpmBaseCommit!;
            expect(() => validateConnectorRun(changed, connector)).toThrow();
        },
    );

    it.each(["missing-patch", "wrong-head", "wrong-hash"])("should reject false run source composition: %s", mutation => {
        const run = structuredClone(manifest.generationRuns["65391f59-b383-4d89-b912-5c90cc89f423"]);
        if (mutation === "missing-patch") delete run.generator.sourcePatch;
        if (mutation === "wrong-head") run.generator.bpmHeadCommit = "0".repeat(40);
        if (mutation === "wrong-hash") run.generator.sourcePatch!.sha256 = "0".repeat(64);
        expect(() => validateRunSource(run)).toThrow();
    });

    const connectorCases: Array<[string, ManifestConnectorEntry]> = manifest.connectors.map(
        connector => [connector.apiName, connector],
    );

    it.each(connectorCases)(
        "should match the committed swagger test fixture hash for '%s'",
        (_apiName: string, connector: ManifestConnectorEntry) => {
            expect(fs.existsSync(path.join(RepositoryRoot, connector.swaggerFixture))).toBe(true);
            expect(fs.existsSync(path.join(RepositoryRoot, connector.outputFile))).toBe(true);
            expect(computeCanonicalTextSha256(connector.swaggerFixture)).toBe(connector.swaggerFixtureSha256);
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

    it.each(connectorCases)(
        "should record a valid connector-specific generator commit for '%s' when present",
        (_apiName: string, connector: ManifestConnectorEntry) => {
            if (connector.generatorCommit !== undefined) {
                expect(connector.generatorCommit).toMatch(/^[0-9a-f]{40}$/);
                expect(connector.sourcePatch).toBeDefined();
            }
        },
    );

    it.each(connectorCases)(
        "should match the connector-specific source patch for '%s' when present",
        (_apiName: string, connector: ManifestConnectorEntry) => {
            if (connector.sourcePatch !== undefined) {
                expect(connector.generatorCommit).toMatch(/^[0-9a-f]{40}$/);
                expect(connector.sourcePatch.path).toBeTruthy();
                expect(connector.sourcePatch.sha256).toMatch(/^[0-9a-f]{64}$/);
                expect(fs.existsSync(path.join(RepositoryRoot, connector.sourcePatch.path))).toBe(true);
                expect(computeCanonicalTextSha256(connector.sourcePatch.path))
                    .toBe(connector.sourcePatch.sha256);
            }
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

            const triggerRoutes = loadSwaggerTriggerRoutes(connector.swaggerFixture);
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
