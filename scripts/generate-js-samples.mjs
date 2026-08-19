// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Generates JavaScript (.mjs and .cjs) sample files from the committed
 * TypeScript samples for every connector where a JS counterpart is missing.
 *
 * Approach:
 *   - Uses the TypeScript parser to locate type-only syntax, then removes it
 *     from the original source so comments and formatting remain stable.
 *   - Converts CJS imports to destructured require() calls.
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
 * Returns the runtime imports used by the sample corpus.
 */
function getRuntimeImportNames(importDeclaration) {
    const importClause = importDeclaration.importClause;
    if (!importClause?.namedBindings || !ts.isNamedImports(importClause.namedBindings)) {
        return [];
    }

    const moduleSpecifier = importDeclaration.moduleSpecifier.text;
    return importClause.namedBindings.elements
        .filter(importSpecifier =>
            moduleSpecifier === "@azure/connectors" ||
            (moduleSpecifier.startsWith("@azure/connectors/generated/") && importSpecifier.name.text.endsWith("Client")))
        .map(importSpecifier => importSpecifier.name.text);
}

/**
 * Removes TypeScript-only syntax while retaining the source's whitespace.
 */
function stripTypeScriptSyntax(source, sourceFileName, moduleShape) {
    const sourceFile = ts.createSourceFile(
        sourceFileName,
        source,
        ts.ScriptTarget.ES2022,
        true,
        ts.ScriptKind.TS,
    );
    const edits = [];

    function removeTypeAnnotation(node) {
        if (!node.type) {
            return;
        }

        const typeStart = node.type.getStart(sourceFile);
        const colonStart = source.lastIndexOf(":", typeStart);
        edits.push({ start: colonStart, end: node.type.end, replacement: "" });
    }

    function visit(node) {
        if (ts.isImportDeclaration(node)) {
            const runtimeImportNames = getRuntimeImportNames(node);
            const moduleSpecifier = node.moduleSpecifier.text;
            const replacement = runtimeImportNames.length === 0
                ? ""
                : moduleShape === "esm"
                    ? `import { ${runtimeImportNames.join(", ")} } from "${moduleSpecifier}";`
                    : `const { ${runtimeImportNames.join(", ")} } = require("${moduleSpecifier}");`;
            edits.push({ start: node.getStart(sourceFile), end: node.end, replacement });
            return;
        }

        if (ts.isVariableDeclaration(node) ||
            ts.isParameter(node) ||
            ts.isFunctionDeclaration(node) ||
            ts.isFunctionExpression(node) ||
            ts.isArrowFunction(node) ||
            ts.isMethodDeclaration(node)) {
            removeTypeAnnotation(node);
        }

        if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
            edits.push({ start: node.expression.end, end: node.end, replacement: "" });
        } else if (ts.isNonNullExpression(node)) {
            edits.push({ start: node.expression.end, end: node.end, replacement: "" });
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return edits
        .sort((left, right) => right.start - left.start)
        .reduce(
            (result, edit) => result.slice(0, edit.start) + edit.replacement + result.slice(edit.end),
            source,
        );
}

/**
 * Applies the JSDoc header, usage-block, and log-string rewording that maps
 * the ESM / CJS TypeScript samples onto their JavaScript counterparts.
 */
function applyHeaderRewrites(source, moduleShape) {
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
        " *   Run:\n *     npm start\n",
    );

    // Short-form usage block: only the dev-run line.
    result = result.replace(
        / \*   Run with tsx \(dev\):\r?\n \*     (?:npm run dev|npx tsx [^\r\n]+)\r?\n(?= \*\/)/,
        " *   Run:\n *     npm start\n",
    );

    // In-code log strings referring to the sample flavour.
    result = result.replace(/\b(ESM|CJS) TypeScript(?=\b)/g, "$1 JavaScript");

    return result;
}

/**
 * Transforms an ESM TypeScript sample into an ESM JavaScript (.mjs) sample.
 */
function transformEsmSample(source, sourceFileName) {
    return stripTypeScriptSyntax(
        applyHeaderRewrites(source, "esm"),
        sourceFileName,
        "esm",
    );
}

/**
 * Transforms a CJS TypeScript sample into a CJS JavaScript (.cjs) sample.
 */
function transformCjsSample(source, sourceFileName) {
    const result = stripTypeScriptSyntax(
        applyHeaderRewrites(source, "cjs"),
        sourceFileName,
        "cjs",
    );
    return result.replace(/(\*\/\r?\n\r?\n)(?=const\s+\{)/, `$1"use strict";${result.includes("\r\n") ? "\r\n\r\n" : "\n\n"}`);
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
        fs.writeFileSync(targetFile, transform(source, sourceFile));
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
