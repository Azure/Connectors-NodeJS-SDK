// Copyright (c) Microsoft Corporation.  All rights reserved.

import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

/** Verify documentation against compiler-discovered public exports and members. */
export function validatePublicApi(program, documentation, entryPoints) {
    const checker = program.getTypeChecker();
    const declarationsById = new Map(documentation.children?.flatMap(module =>
        (module.children ?? []).map(declaration => [declaration.id, declaration])));
    let exportCount = 0;
    let memberCount = 0;

    for (const entryPoint of entryPoints) {
        const sourceFile = program.getSourceFile(entryPoint);
        assert.ok(sourceFile, `Missing source entry point '${entryPoint}'.`);
        const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
        assert.ok(moduleSymbol, `Missing module symbol for '${entryPoint}'.`);
        const moduleName = entryPoint.replace(/^src\//, "").replace(/\.ts$/, "").replace(/\/index$/, "");
        const moduleDocumentation = documentation.children?.find(module => module.name === moduleName);
        assert.ok(moduleDocumentation, `Missing API documentation for '${moduleName}'.`);

        for (const exportedSymbol of checker.getExportsOfModule(moduleSymbol)) {
            const target = exportedSymbol.flags & ts.SymbolFlags.Alias
                ? checker.getAliasedSymbol(exportedSymbol)
                : exportedSymbol;
            if (isExcluded(target, checker)) {
                continue;
            }

            let declaration = moduleDocumentation.children?.find(child => child.name === exportedSymbol.name);
            assert.ok(declaration, `Missing public export '${exportedSymbol.name}' in '${moduleName}'.`);
            if (declaration.variant === "reference") {
                declaration = declarationsById.get(declaration.target);
                assert.ok(declaration && declaration.variant !== "reference",
                    `Unresolved documentation reference '${moduleName}.${exportedSymbol.name}'.`);
            }
            exportCount++;

            if (!target.declarations?.some(node => !program.isSourceFileFromExternalLibrary(node.getSourceFile()))) {
                continue;
            }

            for (const member of [...(target.members?.values() ?? []), ...(target.exports?.values() ?? [])]) {
                if (member.name === "prototype" || member.flags & ts.SymbolFlags.TypeParameter || isExcluded(member, checker)) {
                    continue;
                }

                if (member.name === "__index") {
                    assert.ok(declaration.indexSignatures?.length,
                        `Missing index signature in '${moduleName}.${exportedSymbol.name}'.`);
                } else {
                    const memberName = member.name === "__constructor" ? "constructor" : member.name;
                    const members = declaration.children ?? declaration.type?.declaration?.children;
                    assert.ok(members?.some(child => child.name === memberName),
                        `Missing public member '${moduleName}.${exportedSymbol.name}.${memberName}'.`);
                }
                memberCount++;
            }
        }
    }

    return { moduleCount: entryPoints.length, exportCount, memberCount };
}

function isExcluded(symbol, checker) {
    return symbol.getJsDocTags(checker).some(tag => tag.name === "internal") ||
        symbol.declarations?.some(declaration =>
            (ts.getCombinedModifierFlags(declaration) & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) !== 0 ||
            (declaration.name && ts.isPrivateIdentifier(declaration.name)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const configuration = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
    assert.equal(configuration.error, undefined, "Cannot read the SDK TypeScript configuration.");
    const parsedConfiguration = ts.parseJsonConfigFileContent(configuration.config, ts.sys, process.cwd());
    assert.equal(parsedConfiguration.errors.length, 0, "Invalid SDK TypeScript configuration.");
    const program = ts.createProgram(parsedConfiguration.fileNames, parsedConfiguration.options);
    const documentation = JSON.parse(await readFile("artifacts/api-docs.json", "utf8"));
    const generatedFiles = (await readdir("src/generated")).filter(fileName =>
        fileName.endsWith("Extensions.ts") ||
        fileName === "connectorNames.ts" ||
        fileName === "ManagedConnectors.ts");
    const entryPoints = ["src/azureConnectors/index.ts", ...generatedFiles.map(fileName => `src/generated/${fileName}`)];
    const { moduleCount, exportCount, memberCount } = validatePublicApi(program, documentation, entryPoints);
    assert.ok((await stat(path.join("site", "index.html"))).size > 0,
        "Documentation landing page is missing or empty.");
    console.log(`Validated ${moduleCount} API modules, ${exportCount} public exports, and ${memberCount} members.`);
}
