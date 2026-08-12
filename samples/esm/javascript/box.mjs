// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Box Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates using the Box connector with ESM imports in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:BOX_CONNECTION_URL = "https://[region].azure-apihub.net/apim/box/[connection-id]"
 *     $env:BOX_TEST_FILE_ID   = "[optional file id]"
 *
 *   Run:
 *     node box.mjs
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { BoxClient } from "@azure/connectors/generated/BoxExtensions";

const CONNECTION_URL = process.env.BOX_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: BOX_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new BoxClient(CONNECTION_URL, tokenProvider);

    // Example 1: List the root folder.
    try {
        const files = await client.listRootFolderAsync();
        console.log(`Found ${files.length} item(s) in the root folder.`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: Get file metadata by id (requires BOX_TEST_FILE_ID).
    const fileId = process.env.BOX_TEST_FILE_ID;
    if (fileId) {
        try {
            const metadata = await client.getFileMetadataAsync(fileId);
            console.log("File metadata:", JSON.stringify(metadata, null, 2));
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }
    } else {
        console.log("Set BOX_TEST_FILE_ID to fetch file metadata.");
    }
}

main().catch(console.error);
