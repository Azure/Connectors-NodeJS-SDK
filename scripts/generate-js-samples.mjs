// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Generates JavaScript (.mjs and .cjs) sample files from the committed
 * TypeScript samples for every connector where a JS counterpart is missing.
 *
 * Approach:
 *   - Uses the TypeScript compiler to remove types and type-only imports.
 *   - Emits native ESM or CommonJS without attempting to parse TypeScript
 *     syntax with regular expressions.
 *   - Rewords the JSDoc header and any in-code log strings from TypeScript
 *     to JavaScript so the sample self-describes correctly.
 *
 * Usage:
 *   node scripts/generate-js-samples.mjs           # write missing files only
 *   node scripts/generate-js-samples.mjs --force   # overwrite existing files
 *   node scripts/generate-js-samples.mjs --force --output-root <directory>
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const RepositoryRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const EsmTypeScriptDir = path.join(RepositoryRoot, "samples", "esm", "typescript");
const CjsTypeScriptDir = path.join(RepositoryRoot, "samples", "cjs", "typescript");

const ForceOverwrite = process.argv.includes("--force");
const OutputRootArgumentIndex = process.argv.indexOf("--output-root");
if (OutputRootArgumentIndex >= 0 && !process.argv[OutputRootArgumentIndex + 1]) {
    throw new Error("The '--output-root' option requires a directory path.");
}

const OutputRoot = OutputRootArgumentIndex >= 0
    ? path.resolve(process.argv[OutputRootArgumentIndex + 1])
    : path.join(RepositoryRoot, "samples");
const EsmJavaScriptDir = path.join(OutputRoot, "esm", "javascript");
const CjsJavaScriptDir = path.join(OutputRoot, "cjs", "javascript");

/**
 * Transpiles a TypeScript sample using the compiler's parser and emitter.
 */
function transpileSample(source, sourceFileName, moduleKind) {
    const result = ts.transpileModule(source, {
        compilerOptions: {
            module: moduleKind,
            newLine: ts.NewLineKind.LineFeed,
            removeComments: false,
            target: ts.ScriptTarget.ES2022,
        },
        fileName: sourceFileName,
        reportDiagnostics: true,
    });
    const errors = (result.diagnostics ?? [])
        .filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error);

    if (errors.length > 0) {
        throw new Error(ts.formatDiagnostics(errors, {
            getCanonicalFileName: fileName => fileName,
            getCurrentDirectory: () => RepositoryRoot,
            getNewLine: () => "\n",
        }));
    }

    return result.outputText;
}

/**
 * Applies the JSDoc header, usage-block, and log-string rewording that maps
 * the ESM / CJS TypeScript samples onto their JavaScript counterparts.
 */
function applyHeaderRewrites(source, moduleShape, targetFileName) {
    let result = source;

    // Header separator is either an em-dash or a hyphen; preserve whichever
    // the source uses.
    result = result.replace(
        /(Sample\s+[—-]\s+(?:ESM|CJS))\s+TypeScript(\s|$)/gm,
        "$1 JavaScript$2",
    );

    // "in TypeScript." → "in plain JavaScript." on the "Demonstrates" line.
    result = result.replace(/\bin TypeScript\./g, "in plain JavaScript.");

    if (moduleShape === "cjs") {
        result = result.replace(
            /with CommonJS module output in plain JavaScript\./g,
            "with CommonJS require() in plain JavaScript.",
        );
    }

    // Long-form usage block: dev-run + build-run.
    result = result.replace(
        / \*   Run with tsx \(dev\):\r?\n \*     (?:npm run dev|npx tsx [^\r\n]+)\r?\n \*\r?\n \*   Or compile and run:\r?\n \*     (?:npm run build|node dist\/[^\r\n]+)\r?\n(?: \*     [^\r\n]+\r?\n)?/,
        ` *   Run:\n *     node ${targetFileName}\n`,
    );

    // Short-form usage block: only the dev-run line.
    result = result.replace(
        / \*   Run with tsx \(dev\):\r?\n \*     (?:npm run dev|npx tsx [^\r\n]+)\r?\n(?= \*\/)/,
        ` *   Run:\n *     node ${targetFileName}\n`,
    );

    // In-code log strings referring to the sample flavour.
    result = result.replace(/\b(ESM|CJS) TypeScript(?=\b)/g, "$1 JavaScript");

    return result;
}

/**
 * Transforms an ESM TypeScript sample into an ESM JavaScript (.mjs) sample.
 */
function transformEsmSample(source, sourceFileName, targetFileName) {
    return transpileSample(
        applyHeaderRewrites(source, "esm", targetFileName),
        sourceFileName,
        ts.ModuleKind.ESNext,
    );
}

/**
 * Transforms a CJS TypeScript sample into a CJS JavaScript (.cjs) sample.
 */
function transformCjsSample(source, sourceFileName, targetFileName) {
    return transpileSample(
        applyHeaderRewrites(source, "cjs", targetFileName),
        sourceFileName,
        ts.ModuleKind.CommonJS,
    );
}

/**
 * Writes JS counterparts for every TS sample in sourceDir where the target
 * file is missing, or all of them when --force is set.
 */
function generateMissingSamples(sourceDir, sourceExt, targetDir, targetExt, transform) {
    const results = { written: [], skipped: [] };
    fs.mkdirSync(targetDir, { recursive: true });

    for (const entry of fs.readdirSync(sourceDir).sort()) {
        if (!entry.endsWith(sourceExt)) {
            continue;
        }

        const connectorName = entry.slice(0, -sourceExt.length);
        const targetFile = path.join(targetDir, `${connectorName}${targetExt}`);

        if (fs.existsSync(targetFile) && !ForceOverwrite) {
            results.skipped.push(connectorName);
            continue;
        }

        const sourceFile = path.join(sourceDir, entry);
        const source = fs.readFileSync(sourceFile, "utf8");
        fs.writeFileSync(targetFile, transform(source, sourceFile, path.basename(targetFile)));
        results.written.push(connectorName);
    }

    return results;
}

const esmResults = generateMissingSamples(
    EsmTypeScriptDir,
    ".ts",
    EsmJavaScriptDir,
    ".mjs",
    transformEsmSample,
);
console.log(`ESM .mjs: wrote ${esmResults.written.length}, skipped ${esmResults.skipped.length}`);
if (esmResults.written.length > 0) {
    console.log(`  wrote: ${esmResults.written.join(", ")}`);
}

const cjsResults = generateMissingSamples(
    CjsTypeScriptDir,
    ".ts",
    CjsJavaScriptDir,
    ".cjs",
    transformCjsSample,
);
console.log(`CJS .cjs: wrote ${cjsResults.written.length}, skipped ${cjsResults.skipped.length}`);
if (cjsResults.written.length > 0) {
    console.log(`  wrote: ${cjsResults.written.join(", ")}`);
}
