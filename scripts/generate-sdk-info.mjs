// Copyright (c) Microsoft Corporation.  All rights reserved.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RepositoryRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PackageJsonPath = path.join(RepositoryRoot, "package.json");
const SdkInfoPath = path.join(RepositoryRoot, "src", "azureConnectors", "sdkInfo.ts");
const packageMetadata = JSON.parse(fs.readFileSync(PackageJsonPath, "utf8"));

if (typeof packageMetadata.name !== "string" || typeof packageMetadata.version !== "string") {
    throw new Error("Package metadata must include string 'name' and 'version' values.");
}

const source = `// Copyright (c) Microsoft Corporation.  All rights reserved.

// This file is generated from package.json by scripts/generate-sdk-info.mjs.

/** The npm package name used for SDK diagnostics. */
export const SDK_PACKAGE_NAME = ${JSON.stringify(packageMetadata.name)};

/** The npm package version used for SDK diagnostics. */
export const SDK_VERSION = ${JSON.stringify(packageMetadata.version)};

/** The Azure SDK user-agent prefix sent with connector requests. */
export const SDK_USER_AGENT_PREFIX = \`azsdk-js-connectors/\${SDK_VERSION}\`;
`;

if (!fs.existsSync(SdkInfoPath) || fs.readFileSync(SdkInfoPath, "utf8") !== source) {
    fs.writeFileSync(SdkInfoPath, source, "utf8");
}