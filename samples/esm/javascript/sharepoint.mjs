// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * SharePoint Online Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates how to use the SharePoint Online connector with ESM imports in plain JavaScript.
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
 *   Run:
 *     npm run sharepoint
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { SharepointonlineClient } from "@azure/connectors/generated/SharepointonlineExtensions";

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

async function main() {
    console.log("SharePoint Online Connector SDK — ESM JavaScript Sample");
    console.log("=".repeat(55));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new SharepointonlineClient(CONNECTION_URL, tokenProvider);
    const listName = process.env.TEST_LIST_NAME ?? "Documents";

    // Example 1: Get all lists and libraries
    console.log("\n--- Get All Lists and Libraries ---");
    try {
        const tables = await client.getAllTablesAsync(SITE_URL);
        const lists = tables?.value ?? [];

        if (lists.length > 0) {
            console.log(`Found ${lists.length} lists and libraries:`);
            for (const listItem of lists.slice(0, 5)) {
                console.log(`  - ${listItem.DisplayName ?? "Unknown"} (${listItem.Name ?? "Unknown"})`);
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
        const items = await client.getItemsAsync(SITE_URL, listName);
        const itemValues = items?.value ?? [];

        if (itemValues.length > 0) {
            console.log(`Found ${itemValues.length} items:`);
            for (const item of itemValues.slice(0, 5)) {
                console.log(`  - [${item.ID ?? "?"}] ${item.Title ?? item.FileLeafRef ?? "No Title"}`);
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
        const files = await client.getFileItemsAsync(SITE_URL, listName);
        const fileValues = files?.value ?? [];

        if (fileValues.length > 0) {
            console.log(`Found ${fileValues.length} files:`);
            for (const file of fileValues.slice(0, 5)) {
                console.log(`  - ${file.FileLeafRef ?? file.Title ?? "Unknown"} (ID: ${file.ID ?? "?"})`);
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
                console.log(`  - ${file.DisplayName ?? file.Name ?? "Unknown"} (folder: ${file.IsFolder ?? false})`);
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
            const created = await client.postItemAsync(
                { Title: `SDK Test ${new Date().toISOString()}` },
                SITE_URL,
                crudListName,
            );
            const itemId = String(created?.ID);
            console.log(`  Created item ${itemId}: ${created?.Title}`);

            // READ
            console.log("Reading item...");
            const item = await client.getItemAsync(SITE_URL, crudListName, itemId);
            console.log(`  Read item ${itemId}: ${item?.Title}`);

            // UPDATE
            console.log("Updating item...");
            await client.patchItemAsync(
                { Title: "Updated by SDK" },
                SITE_URL,
                crudListName,
                itemId,
            );
            const updated = await client.getItemAsync(SITE_URL, crudListName, itemId);
            console.log(`  Updated item ${itemId}: ${updated?.Title}`);

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
            console.log(`Unexpected error type: ${error?.constructor?.name}`);
        }
    }

    console.log("\n" + "=".repeat(55));
    console.log("Sample completed!");
}

main().catch(console.error);
