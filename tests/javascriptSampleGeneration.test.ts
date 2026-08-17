// Copyright (c) Microsoft Corporation.  All rights reserved.

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const RepositoryRoot = process.cwd();
const GeneratorPath = path.join(RepositoryRoot, "scripts", "generate-js-samples.mjs");
const TemporaryOutputRoot = fs.mkdtempSync(path.join(os.tmpdir(), "connector-js-samples-"));

interface SampleShape {
    sourceDirectory: string;
    outputDirectory: string;
    committedOutputDirectory: string;
    sourceExtension: string;
    outputExtension: string;
}

const SampleShapes: SampleShape[] = [
    {
        sourceDirectory: path.join(RepositoryRoot, "samples", "esm", "typescript"),
        outputDirectory: path.join(TemporaryOutputRoot, "esm", "javascript"),
        committedOutputDirectory: path.join(RepositoryRoot, "samples", "esm", "javascript"),
        sourceExtension: ".ts",
        outputExtension: ".mjs",
    },
    {
        sourceDirectory: path.join(RepositoryRoot, "samples", "cjs", "typescript"),
        outputDirectory: path.join(TemporaryOutputRoot, "cjs", "javascript"),
        committedOutputDirectory: path.join(RepositoryRoot, "samples", "cjs", "javascript"),
        sourceExtension: ".ts",
        outputExtension: ".cjs",
    },
];

const ExpectedGeneratedFiles = SampleShapes.flatMap(sampleShape =>
    fs
        .readdirSync(sampleShape.sourceDirectory)
        .filter(fileName => fileName.endsWith(sampleShape.sourceExtension))
        .map(fileName => path.join(
            sampleShape.outputDirectory,
            `${path.basename(fileName, sampleShape.sourceExtension)}${sampleShape.outputExtension}`,
        )),
);

describe("JavaScript sample generation", () => {
    beforeAll(() => {
        execFileSync(
            process.execPath,
            [GeneratorPath, "--force", "--output-root", TemporaryOutputRoot],
            { cwd: RepositoryRoot, encoding: "utf8" },
        );
    });

    afterAll(() => {
        fs.rmSync(TemporaryOutputRoot, { recursive: true, force: true });
    });

    it("should generate one ESM and CJS JavaScript sample for every TypeScript sample", () => {
        for (const generatedFile of ExpectedGeneratedFiles) {
            expect(fs.existsSync(generatedFile)).toBe(true);
        }
    });

    it.each(ExpectedGeneratedFiles)("should generate syntactically valid JavaScript for '%s'", generatedFile => {
        expect(() => execFileSync(
            process.execPath,
            ["--check", generatedFile],
            { cwd: RepositoryRoot, encoding: "utf8", stdio: "pipe" },
        )).not.toThrow();
    });

    it.each(SampleShapes)("should reproduce committed $outputExtension samples", sampleShape => {
        const generatedFileNames = fs
            .readdirSync(sampleShape.outputDirectory)
            .filter(fileName => fileName.endsWith(sampleShape.outputExtension));

        for (const fileName of generatedFileNames) {
            const generatedContent = fs
                .readFileSync(path.join(sampleShape.outputDirectory, fileName), "utf8")
                .replace(/\r\n/g, "\n");
            const committedContent = fs
                .readFileSync(path.join(sampleShape.committedOutputDirectory, fileName), "utf8")
                .replace(/\r\n/g, "\n");
            expect(generatedContent).toBe(committedContent);
        }
    });
});
