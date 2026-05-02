// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * SharePoint Online Connector SDK Sample — CJS TypeScript
 *
 * Demonstrates how to use the SharePoint Online connector with CommonJS in TypeScript.
 *
 * Prerequisites:
 *   1. Azure subscription with SharePoint Online connection via AI Gateway
 *   2. Connection runtime URL from Azure Portal
 *   3. SharePoint site URL
 *   4. npm install in this folder
 *
 * Usage:
 *   Set environment variables:
 *     $env:SHAREPOINT_CONNECTION_URL = "https://[region].azure-apihub.net/apim/sharepointonline/[connection-id]"
 *     $env:SHAREPOINT_SITE_URL = "https://[tenant].sharepoint.com/sites/[site-name]"
 *
 *   Run with tsx (dev):
 *     npx tsx sharepoint.ts
 *
 *   Or compile and run:
 *     npm run build
 *     node dist/sharepoint.js
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/azure-connectors";
import { SharepointonlineClient, TablesList, ItemsList, PostItemResponse, GetItemResponse } from "@azure/azure-connectors/generated/SharepointonlineExtensions";

const CONNECTION_URL = process.env.SHAREPOINT_CONNECTION_URL ?? "";
const SITE_URL = process.env.SHAREPOINT_SITE_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: SHAREPOINT_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

if (!SITE_URL) {
    console.error("Error: SHAREPOINT_SITE_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    console.log("SharePoint Online Connector SDK — CJS TypeScript Sample");
    console.log("=".repeat(55));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new SharepointonlineClient(CONNECTION_URL, tokenProvider);
    const listName = process.env.TEST_LIST_NAME ?? "Documents";

    // Example 1: Get all lists and libraries
    console.log("\n--- Get All Lists and Libraries ---");
    try {
        const tables: TablesList = await client.getAllTablesAsync(SITE_URL);
        const lists = tables.value ?? [];

        if (lists.length > 0) {
            console.log(`Found ${lists.length} lists and libraries:`);
            for (const listItem of lists.slice(0, 5)) {
                const record = listItem as Record<string, unknown>;
                console.log(`  - ${record.DisplayName ?? "Unknown"} (${record.Name ?? "Unknown"})`);
            }
        } else {
            console.log("No lists found.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error: ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: Get list items
    console.log(`\n--- Get List Items (${listName}) ---`);
    try {
        const items: ItemsList = await client.getItemsAsync(SITE_URL, listName);
        const itemValues = items.value ?? [];

        if (itemValues.length > 0) {
            console.log(`Found ${itemValues.length} items:`);
            for (const item of itemValues.slice(0, 5)) {
                const record = item as Record<string, unknown>;
                console.log(`  - [${record.ID ?? "?"}] ${record.Title ?? record.FileLeafRef ?? "No Title"}`);
            }
        } else {
            console.log(`No items found in '${listName}'.`);
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 3: Get files (properties only) from a library
    console.log(`\n--- Get File Properties (${listName}) ---`);
    try {
        const files: ItemsList = await client.getFileItemsAsync(SITE_URL, listName);
        const fileValues = files.value ?? [];

        if (fileValues.length > 0) {
            console.log(`Found ${fileValues.length} files:`);
            for (const file of fileValues.slice(0, 5)) {
                const record = file as Record<string, unknown>;
                console.log(`  - ${record.FileLeafRef ?? record.Title ?? "Unknown"} (ID: ${record.ID ?? "?"})`);
            }
        } else {
            console.log(`No files found in '${listName}'.`);
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 4: List root folder files
    console.log("\n--- List Root Folder ---");
    try {
        const rootFiles = await client.listRootFolderAsync(SITE_URL);

        if (rootFiles && rootFiles.length > 0) {
            console.log(`Found ${rootFiles.length} items in root folder:`);
            for (const file of rootFiles.slice(0, 5)) {
                const record = file as Record<string, unknown>;
                console.log(`  - ${record.DisplayName ?? record.Name ?? "Unknown"} (folder: ${record.IsFolder ?? false})`);
            }
        } else {
            console.log("No items in root folder.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 5: Full CRUD on a list item
    const crudListName = process.env.TEST_CRUD_LIST_NAME;
    if (crudListName) {
        console.log(`\n--- Full CRUD (${crudListName}) ---`);
        try {
            // CREATE
            console.log("Creating item...");
            const created: PostItemResponse = await client.postItemAsync(
                { Title: `SDK Test ${new Date().toISOString()}` },
                SITE_URL,
                crudListName,
            );
            const createdRecord = created as Record<string, unknown>;
            const itemId = String(createdRecord.ID);
            console.log(`  Created item ${itemId}: ${createdRecord.Title}`);

            // READ
            console.log("Reading item...");
            const item: GetItemResponse = await client.getItemAsync(SITE_URL, crudListName, itemId);
            const itemRecord = item as Record<string, unknown>;
            console.log(`  Read item ${itemId}: ${itemRecord.Title}`);

            // UPDATE
            console.log("Updating item...");
            await client.patchItemAsync(
                { Title: "Updated by SDK" },
                SITE_URL,
                crudListName,
                itemId,
            );
            const updated: GetItemResponse = await client.getItemAsync(SITE_URL, crudListName, itemId);
            const updatedRecord = updated as Record<string, unknown>;
            console.log(`  Updated item ${itemId}: ${updatedRecord.Title}`);

            // DELETE
            console.log("Deleting item...");
            await client.deleteItemAsync(SITE_URL, crudListName, itemId);
            console.log(`  Deleted item ${itemId}`);

            console.log("Full CRUD cycle completed successfully!");
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }
    } else {
        console.log("\n--- Full CRUD (skipped) ---");
        console.log("Set TEST_CRUD_LIST_NAME to a writable list name to run CRUD examples.");
    }

    // Example 6: Error handling
    console.log("\n--- Error Handling ---");
    try {
        await client.getItemsAsync(SITE_URL, "NonExistentList_12345");
        console.log("Unexpected success.");
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log("Expected error caught:");
            console.log(`  Message: ${error.message}`);
            console.log(`  Status: ${error.statusCode}`);
        } else {
            console.log(`Unexpected error type: ${(error as Error).constructor.name}`);
        }
    }

    console.log("\n" + "=".repeat(55));
    console.log("Sample completed!");
}

main().catch(console.error);
