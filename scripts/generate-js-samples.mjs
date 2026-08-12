// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Generates JavaScript (.mjs and .cjs) sample files from the committed
 * TypeScript samples for every connector where a JS counterpart is missing.
 *
 * Approach:
 *   - Regex-based transform that preserves whitespace and comments from the
 *     TS source so the generated JS matches the hand-written baselines.
 *   - Filters type-only imports using the SDK's simple runtime allowlist:
 *       * everything exported from "@azure/connectors" is runtime;
 *       * from "@azure/connectors/generated/<Api>Extensions" only the
 *         *Client class is runtime — every other name is a TS type.
 *   - Strips type annotations on functions, variables, and parameters, plus
 *     `as T` (and chained `as unknown as T`) type assertions.
 *   - For CJS, rewrites `import { A, B } from "X";` as
 *     `const { A, B } = require("X");` and inserts `"use strict";`.
 *   - Rewords the JSDoc header and any in-code log strings from TypeScript
 *     to JavaScript so the sample self-describes correctly.
 *
 * Usage:
 *   node scripts/generate-js-samples.mjs           # write missing files only
 *   node scripts/generate-js-samples.mjs --force   # overwrite existing files
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RepositoryRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const EsmTypeScriptDir = path.join(RepositoryRoot, "samples", "esm", "typescript");
const EsmJavaScriptDir = path.join(RepositoryRoot, "samples", "esm", "javascript");
const CjsTypeScriptDir = path.join(RepositoryRoot, "samples", "cjs", "typescript");
const CjsJavaScriptDir = path.join(RepositoryRoot, "samples", "cjs", "javascript");

const ForceOverwrite = process.argv.includes("--force");

/**
 * Returns the runtime-only subset of an `import { ... }` specifier list based
 * on the SDK's simple allowlist.
 */
function filterRuntimeImports(importNames, moduleSpecifier) {
    const names = importNames
        .split(",")
        .map(name => name.trim())
        .filter(name => name.length > 0);

    if (moduleSpecifier === "@azure/connectors") {
        return names;
    }

    if (moduleSpecifier.startsWith("@azure/connectors/generated/")) {
        return names.filter(name => name.endsWith("Client"));
    }

    return names;
}

/**
 * Walks the source starting at typeStart and returns the exclusive end index
 * of a TypeScript type expression, following angle-bracket depth, chained
 * unions and intersections, and `as unknown as T` sequences.
 */
function findTypeExpressionEnd(source, typeStart) {
    let index = typeStart;
    let angleDepth = 0;

    while (index < source.length) {
        const character = source[index];

        if (character === "<") {
            angleDepth += 1;
            index += 1;
            continue;
        }

        if (character === ">") {
            if (angleDepth === 0) {
                break;
            }

            angleDepth -= 1;
            index += 1;
            continue;
        }

        if (angleDepth > 0) {
            index += 1;
            continue;
        }

        if (/[\w.[\]?]/.test(character)) {
            index += 1;
            continue;
        }

        if (character === " " || character === "\t") {
            const lookahead = source.slice(index).match(/^[ \t]+(as[ \t]|[|&][ \t]*[\w.[])/);
            if (lookahead) {
                index += lookahead[0].length - 1;
                continue;
            }

            break;
        }

        break;
    }

    return index;
}

/**
 * Removes every ` as <TypeExpression>` type assertion (including chained
 * `as unknown as T`) from the source.
 */
function stripAsCasts(source) {
    let result = "";
    let cursor = 0;
    const asPattern = /\bas[ \t]/g;

    while (true) {
        asPattern.lastIndex = cursor;
        const match = asPattern.exec(source);
        if (match === null) {
            result += source.slice(cursor);
            break;
        }

        const previousChar = source[match.index - 1];
        const isCast = previousChar === " " || previousChar === "\t"
            || previousChar === ")" || previousChar === "]";

        if (!isCast) {
            result += source.slice(cursor, match.index + match[0].length);
            cursor = match.index + match[0].length;
            continue;
        }

        // Emit everything up to but not including the whitespace before `as`.
        let leadingWhitespaceStart = match.index;
        while (leadingWhitespaceStart > cursor
            && (source[leadingWhitespaceStart - 1] === " " || source[leadingWhitespaceStart - 1] === "\t")) {
            leadingWhitespaceStart -= 1;
        }

        const typeStart = match.index + match[0].length;
        const typeEnd = findTypeExpressionEnd(source, typeStart);

        result += source.slice(cursor, leadingWhitespaceStart);
        cursor = typeEnd;
    }

    return result;
}

/**
 * Rewrites `import { ... } from "..."` lines, filtering type-only names and,
 * for CJS, converting to `const { ... } = require("...")`.
 */
function rewriteImports(source, moduleShape) {
    return source.replace(
        /^(\s*)import\s*\{\s*([^}]+)\s*\}\s*from\s*"([^"]+)";(\r?\n)?/gm,
        (_, indent, list, mod, newline) => {
            const runtimeOnly = filterRuntimeImports(list, mod);
            const suffix = newline ?? "";

            if (runtimeOnly.length === 0) {
                return "";
            }

            if (moduleShape === "esm") {
                return `${indent}import { ${runtimeOnly.join(", ")} } from "${mod}";${suffix}`;
            }

            return `${indent}const { ${runtimeOnly.join(", ")} } = require("${mod}");${suffix}`;
        },
    );
}

/**
 * Strips TypeScript type annotations that this sample corpus uses.  The
 * regex set is intentionally narrow: function return types and variable
 * declaration types.
 */
function stripTypeAnnotations(source) {
    let result = source;

    // Function return-type annotations: `function name(...): T {`.
    result = result.replace(
        /(\bfunction\s+\w+\s*\([^)]*\))\s*:\s*[\w<>[\],?|&\s]+?(\s\{)/g,
        "$1$2",
    );

    // Arrow return-type annotations: `(...) : T =>`.
    result = result.replace(
        /(\)\s*):\s*[\w<>[\],?|&\s]+?(\s=>)/g,
        "$1$2",
    );

    // Variable declaration annotations: `const x: T = ...`. The character
    // class deliberately excludes the space immediately before `=` so a
    // single canonical space is written back regardless of source formatting.
    result = result.replace(
        /(\b(?:const|let|var)\s+\w+)\s*:\s*[\w<>[\],?|&]+(?:\s*[|&,]\s*[\w<>[\]?|&]+)*\s*=/g,
        "$1 =",
    );

    return result;
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
 * Inserts a top-level `"use strict";` directive after the JSDoc header so
 * generated CJS samples match the hand-written baselines.
 */
function insertUseStrict(source) {
    if (/^\s*"use strict";/m.test(source)) {
        return source;
    }

    return source.replace(
        /(\*\/\r?\n\r?\n)(?=const\s+\{)/,
        `$1"use strict";\n\n`,
    );
}

/**
 * Transforms an ESM TypeScript sample into an ESM JavaScript (.mjs) sample.
 */
function transformEsmSample(source) {
    let result = applyHeaderRewrites(source, "esm");
    result = rewriteImports(result, "esm");
    result = stripTypeAnnotations(result);
    result = stripAsCasts(result);
    return result;
}

/**
 * Transforms a CJS TypeScript sample into a CJS JavaScript (.cjs) sample.
 */
function transformCjsSample(source) {
    let result = applyHeaderRewrites(source, "cjs");
    result = rewriteImports(result, "cjs");
    result = stripTypeAnnotations(result);
    result = stripAsCasts(result);
    result = insertUseStrict(result);
    return result;
}

/**
 * Writes JS counterparts for every TS sample in sourceDir where the target
 * file is missing, or all of them when --force is set.
 */
function generateMissingSamples(sourceDir, sourceExt, targetDir, targetExt, transform) {
    const results = { written: [], skipped: [] };

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

        const source = fs.readFileSync(path.join(sourceDir, entry), "utf8");
        fs.writeFileSync(targetFile, transform(source));
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
