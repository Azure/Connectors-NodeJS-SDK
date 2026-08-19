// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Dropbox Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates using the Dropbox connector with ESM imports in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:DROPBOX_CONNECTION_URL = "https://[region].azure-apihub.net/apim/dropbox/[connection-id]"
 *     $env:DROPBOX_TEST_FILE_ID   = "[optional file id]"
 *
 *   Run with tsx (dev):
 *     npx tsx dropbox.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { DropboxClient } from "@azure/connectors/generated/DropboxExtensions";

const CONNECTION_URL = process.env.DROPBOX_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: DROPBOX_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new DropboxClient(CONNECTION_URL, tokenProvider);

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

    // Example 2: Get file metadata by id (requires DROPBOX_TEST_FILE_ID).
    const fileId = process.env.DROPBOX_TEST_FILE_ID;
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
        console.log("Set DROPBOX_TEST_FILE_ID to fetch file metadata.");
    }
}

main().catch(console.error);
