// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Azure Blob Storage Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates how to use the Azure Blob Storage connector with ESM imports in plain JavaScript.
 *
 * Prerequisites:
 *   1. Azure subscription with Azure Blob connection via AI Gateway
 *   2. Connection runtime URL from Azure Portal
 *   3. npm install in this folder
 *
 * Usage:
 *   Set environment variables:
 *     $env:AZUREBLOB_CONNECTION_URL = "https://[region].azure-apihub.net/apim/azureblob/[connection-id]"
 *     $env:BLOB_STORAGE_ACCOUNT = "mystorageaccount"
 *     $env:BLOB_CONTAINER = "mycontainer"
 *
 *   Run:
 *     npm start
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { AzureblobClient } from "@azure/connectors/generated/AzureblobExtensions";

const CONNECTION_URL = process.env.AZUREBLOB_CONNECTION_URL ?? "";
const STORAGE_ACCOUNT = process.env.BLOB_STORAGE_ACCOUNT ?? "";
const CONTAINER = process.env.BLOB_CONTAINER ?? "";

if (!CONNECTION_URL) {
    console.error("Error: AZUREBLOB_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    console.log("Azure Blob Storage Connector SDK — ESM JavaScript Sample");
    console.log("=".repeat(55));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new AzureblobClient(CONNECTION_URL, tokenProvider);

    // Example 1: List blobs in a container
    if (CONTAINER) {
        console.log(`\n--- List Blobs (${CONTAINER}) ---`);
        try {
            const blobs = await client.listFolderAsync(CONTAINER, "/");
            const blobValues = blobs.value ?? [];

            if (blobValues.length > 0) {
                console.log(`Found ${blobValues.length} blobs:`);
                for (const blob of blobValues.slice(0, 10)) {
                    console.log(`  - ${blob.DisplayName ?? blob.Name ?? "Unknown"} (${blob.Size ?? "?"} bytes)`);
                }
            } else {
                console.log("No blobs found.");
            }
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }
    }

    // Example 2: Get blob metadata by path
    const blobPath = process.env.BLOB_TEST_PATH;
    if (blobPath) {
        console.log(`\n--- Get Blob Metadata (${blobPath}) ---`);
        try {
            const metadata = await client.getFileMetadataAsync(CONTAINER, blobPath);

            console.log(`  Name: ${metadata.DisplayName ?? metadata.Name}`);
            console.log(`  Size: ${metadata.Size ?? "unknown"} bytes`);
            console.log(`  Last Modified: ${metadata.LastModified ?? "unknown"}`);
            console.log(`  Content Type: ${metadata.MediaType ?? "unknown"}`);
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }
    }

    // Example 3: Create a share link for a blob
    if (STORAGE_ACCOUNT && blobPath) {
        console.log("\n--- Create Share Link ---");
        try {
            const policy = {};
            const sas = await client.createShareLinkByPathAsync(
                policy,
                STORAGE_ACCOUNT,
                blobPath,
            );
            const webUrl = sas.WebUrl ?? "";
            console.log(`  Share Link: ${webUrl.substring(0, 80)}...`);
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }
    }

    console.log("\n" + "=".repeat(55));
    console.log("Sample completed!");
}

main().catch(console.error);
