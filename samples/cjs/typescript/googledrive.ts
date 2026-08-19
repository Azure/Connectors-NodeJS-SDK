// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Google Drive Connector SDK Sample — CJS TypeScript
 *
 * Demonstrates using the Google Drive connector with CommonJS module output in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:GOOGLEDRIVE_CONNECTION_URL = "https://[region].azure-apihub.net/apim/googledrive/[connection-id]"
 *     $env:GOOGLEDRIVE_TEST_FILE_ID   = "[optional file id]"
 *
 *   Run with tsx (dev):
 *     npx tsx googledrive.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { GoogledriveClient } from "@azure/connectors/generated/GoogledriveExtensions";

const CONNECTION_URL = process.env.GOOGLEDRIVE_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: GOOGLEDRIVE_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new GoogledriveClient(CONNECTION_URL, tokenProvider);

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

    // Example 2: Get file metadata by id (requires GOOGLEDRIVE_TEST_FILE_ID).
    const fileId = process.env.GOOGLEDRIVE_TEST_FILE_ID;
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
        console.log("Set GOOGLEDRIVE_TEST_FILE_ID to fetch file metadata.");
    }
}

main().catch(console.error);
