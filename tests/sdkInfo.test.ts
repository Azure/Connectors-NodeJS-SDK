// Copyright (c) Microsoft Corporation.  All rights reserved.

import * as fs from "node:fs";
import * as path from "node:path";
import {
    SDK_PACKAGE_NAME,
    SDK_USER_AGENT_PREFIX,
    SDK_VERSION,
} from "../src/azureConnectors/sdkInfo.ts";

interface PackageMetadata {
    name: string;
    version: string;
}

describe("SDK package information", () => {
    it("should match package metadata used for diagnostics", () => {
        const packageMetadata = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
        ) as PackageMetadata;

        expect(SDK_PACKAGE_NAME).toBe(packageMetadata.name);
        expect(SDK_VERSION).toBe(packageMetadata.version);
        expect(SDK_USER_AGENT_PREFIX).toBe(`azsdk-js-connectors/${packageMetadata.version}`);
    });
});