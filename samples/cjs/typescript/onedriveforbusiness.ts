// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * OneDrive for Business Connector SDK Sample — CJS TypeScript
 *
 * Demonstrates how to use the OneDrive for Business connector with CommonJS module output in TypeScript.
 *
 * Prerequisites:
 *   1. Azure subscription with OneDrive connection via AI Gateway
 *   2. Connection runtime URL from Azure Portal
 *   3. npm install in this folder
 *
 * Usage:
 *   Set environment variable:
 *     $env:ONEDRIVE_CONNECTION_URL = "https://[region].azure-apihub.net/apim/onedriveforbusiness/[connection-id]"
 *
 *   Run with tsx (dev):
 *     npx tsx onedriveforbusiness.ts
 *
 *   Or compile and run:
 *     npm run build
 *     node dist/onedriveforbusiness.js
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { OnedriveforbusinessClient, BlobMetadata } from "@azure/connectors/generated/OnedriveforbusinessExtensions";

const CONNECTION_URL = process.env.ONEDRIVE_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: ONEDRIVE_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    console.log("OneDrive for Business Connector SDK — CJS TypeScript Sample");
    console.log("=".repeat(58));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new OnedriveforbusinessClient(CONNECTION_URL, tokenProvider);

    // Example 1: List root folder
    console.log("\n--- List Root Folder ---");
    try {
        const files = await client.listRootFolderAsync();
        const fileList = files as Array<Record<string, unknown>> ?? [];

        if (fileList.length > 0) {
            console.log(`Found ${fileList.length} items in root:`);
            for (const file of fileList.slice(0, 10)) {
                const isFolder = file.IsFolder ?? false;
                const icon = isFolder ? "[folder]" : "[file]";
                console.log(`  ${icon} ${file.DisplayName ?? file.Name ?? "Unknown"} (${file.Size ?? "?"} bytes)`);
            }
        } else {
            console.log("No items found in root folder.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error: ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: Get file metadata by ID
    const fileId = process.env.ONEDRIVE_TEST_FILE_ID;
    if (fileId) {
        console.log(`\n--- Get File Metadata (${fileId}) ---`);
        try {
            const metadata: BlobMetadata = await client.getFileMetadataAsync(fileId);
            const record = metadata as Record<string, unknown>;

            console.log(`  Name: ${record.DisplayName ?? record.Name}`);
            console.log(`  Size: ${record.Size ?? "unknown"} bytes`);
            console.log(`  Last Modified: ${record.LastModified ?? "unknown"}`);
            console.log(`  Media Type: ${record.MediaType ?? "unknown"}`);
            console.log(`  Path: ${record.Path ?? "unknown"}`);
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }
    }

    // Example 3: List folder contents
    const folderId = process.env.ONEDRIVE_TEST_FOLDER_ID;
    if (folderId) {
        console.log(`\n--- List Folder Contents ---`);
        try {
            const contents = await client.listFolderAsync(folderId);
            const contentList = contents as Array<Record<string, unknown>> ?? [];

            if (contentList.length > 0) {
                console.log(`Found ${contentList.length} items:`);
                for (const item of contentList.slice(0, 10)) {
                    const isFolder = item.IsFolder ?? false;
                    const icon = isFolder ? "[folder]" : "[file]";
                    console.log(`  ${icon} ${item.DisplayName ?? item.Name ?? "Unknown"}`);
                }
            } else {
                console.log("Folder is empty.");
            }
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }
    }

    // Example 4: Get thumbnail
    if (fileId) {
        console.log(`\n--- Get File Thumbnail ---`);
        try {
            const thumbnail = await client.getThumbnailAsync(fileId);
            const record = thumbnail as Record<string, unknown>;
            console.log(`  Thumbnail URL: ${String(record.Url ?? record.url ?? "none").substring(0, 80)}...`);
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }
    }

    console.log("\n" + "=".repeat(58));
    console.log("Sample completed!");
}

main().catch(console.error);
