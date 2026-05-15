// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Azure Blob Storage Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates how to use the Azure Blob Storage connector with ESM imports in TypeScript.
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
 *   Run with tsx (dev):
 *     npx tsx azureblob.ts
 *
 *   Or compile and run:
 *     npm run build
 *     node dist/azureblob.js
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { AzureblobClient, BlobMetadata, BlobMetadataPage } from "@azure/connectors/generated/AzureblobExtensions";

const CONNECTION_URL = process.env.AZUREBLOB_CONNECTION_URL ?? "";
const STORAGE_ACCOUNT = process.env.BLOB_STORAGE_ACCOUNT ?? "";
const CONTAINER = process.env.BLOB_CONTAINER ?? "";

if (!CONNECTION_URL) {
    console.error("Error: AZUREBLOB_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    console.log("Azure Blob Storage Connector SDK — ESM TypeScript Sample");
    console.log("=".repeat(55));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new AzureblobClient(CONNECTION_URL, tokenProvider);

    // Example 1: List blobs in a container
    if (CONTAINER) {
        console.log(`\n--- List Blobs (${CONTAINER}) ---`);
        try {
            const blobs: BlobMetadataPage = await client.listFolderV2Async(CONTAINER);
            const blobValues = blobs.value ?? [];

            if (blobValues.length > 0) {
                console.log(`Found ${blobValues.length} blobs:`);
                for (const blob of blobValues.slice(0, 10)) {
                    const record = blob as Record<string, unknown>;
                    console.log(`  - ${record.DisplayName ?? record.Name ?? "Unknown"} (${record.Size ?? "?"} bytes)`);
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
            const metadata: BlobMetadata = await client.getFileMetadataAsync(CONTAINER, blobPath);
            const record = metadata as Record<string, unknown>;

            console.log(`  Name: ${record.DisplayName ?? record.Name}`);
            console.log(`  Size: ${record.Size ?? "unknown"} bytes`);
            console.log(`  Last Modified: ${record.LastModified ?? "unknown"}`);
            console.log(`  Content Type: ${record.MediaType ?? "unknown"}`);
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }
    }

    // Example 3: Get SAS URI for a blob
    if (STORAGE_ACCOUNT && blobPath) {
        console.log("\n--- Get SAS URI ---");
        try {
            const sas = await client.createSasUriAsync(
                STORAGE_ACCOUNT,
                CONTAINER,
                blobPath,
            );
            const sasRecord = sas as Record<string, unknown>;
            const webUrl = sasRecord.WebUrl as string ?? "";
            console.log(`  SAS URI: ${webUrl.substring(0, 80)}...`);
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
