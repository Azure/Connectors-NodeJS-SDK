// Copyright (c) Microsoft Corporation.  All rights reserved.

import * as fs from "node:fs";
import * as path from "node:path";

interface SourceMap {
    sources: string[];
    sourcesContent?: Array<string | null>;
}

function findJavaScriptSourceMaps(directory: string): string[] {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            return findJavaScriptSourceMaps(entryPath);
        }

        return entry.name.endsWith(".js.map") ? [entryPath] : [];
    });
}

describe("distribution source maps", () => {
    it.each(["esm", "cjs"])("should embed source content in every %s JavaScript map", distribution => {
        const distributionDirectory = path.join(process.cwd(), "dist", distribution);
        const sourceMapPaths = findJavaScriptSourceMaps(distributionDirectory);

        expect(sourceMapPaths.length).toBeGreaterThan(0);
        for (const sourceMapPath of sourceMapPaths) {
            const sourceMap = JSON.parse(fs.readFileSync(sourceMapPath, "utf8")) as SourceMap;
            expect(sourceMap.sourcesContent).toHaveLength(sourceMap.sources.length);
            expect(sourceMap.sourcesContent?.every(source => typeof source === "string" && source.length > 0)).toBe(true);
        }
    });
});
