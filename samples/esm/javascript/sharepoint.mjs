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
 *     npm start
 */

import { ManagedIdentityTokenProvider, ConnectorError } from "@azure/connectors";
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
        const tables = await client.getAllTables(SITE_URL);
        const lists = tables.value ?? [];

        if (lists.length > 0) {
            console.log(`Found ${lists.length} lists and libraries:`);
            for (const listItem of lists.slice(0, 5)) {
                console.log(`  - ${listItem.DisplayName ?? "Unknown"} (${listItem.Name ?? "Unknown"})`);
            }
        } else {
            console.log("No lists found.");
        }
    } catch (error) {
        if (error instanceof ConnectorError) {
            console.log(`Connector error: ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: Get list items
    console.log(`\n--- Get List Items (${listName}) ---`);
    try {
        const itemValues = [];
        for await (const item of client.getItems(SITE_URL, listName)) {
            itemValues.push(item);
            if (itemValues.length >= 5) {
                break;
            }
        }

        if (itemValues.length > 0) {
            console.log(`Found ${itemValues.length} items:`);
            for (const item of itemValues) {
                console.log(`  - [${item.dynamicProperties?.ID ?? "?"}] ${item.dynamicProperties?.Title ?? item.dynamicProperties?.FileLeafRef ?? "No Title"}`);
            }
        } else {
            console.log(`No items found in '${listName}'.`);
        }
    } catch (error) {
        if (error instanceof ConnectorError) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 3: Get files (properties only) from a library
    console.log(`\n--- Get File Properties (${listName}) ---`);
    try {
        const fileValues = [];
        for await (const file of client.getFileItems(SITE_URL, listName)) {
            fileValues.push(file);
            if (fileValues.length >= 5) {
                break;
            }
        }

        if (fileValues.length > 0) {
            console.log(`Found ${fileValues.length} files:`);
            for (const file of fileValues) {
                console.log(`  - ${file.dynamicProperties?.FileLeafRef ?? file.dynamicProperties?.Title ?? "Unknown"} (ID: ${file.dynamicProperties?.ID ?? "?"})`);
            }
        } else {
            console.log(`No files found in '${listName}'.`);
        }
    } catch (error) {
        if (error instanceof ConnectorError) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 4: Get root folder metadata
    console.log("\n--- Get Root Folder Metadata ---");
    try {
        const rootFolder = await client.getFolderMetadataByPath(SITE_URL, "/");

        if (rootFolder) {
            console.log(`Root folder metadata:`);
            console.log(`  - Name: ${rootFolder.DisplayName ?? rootFolder.Name ?? "Unknown"}`);
            console.log(`  - Path: ${rootFolder.Path ?? "Unknown"}`);
            console.log(`  - Is Folder: ${rootFolder.IsFolder ?? true}`);
        } else {
            console.log("No items in root folder.");
        }
    } catch (error) {
        if (error instanceof ConnectorError) {
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
            const created = await client.postItem(
                { Title: `SDK Test ${new Date().toISOString()}` },
                SITE_URL,
                crudListName,
            );
            const itemId = Number(created.ID);
            if (!Number.isInteger(itemId)) {
                throw new Error("The created item response did not include a numeric ID.");
            }
            console.log(`  Created item ${itemId}: ${created.Title}`);

            // READ
            console.log("Reading item...");
            const item = await client.getItem(SITE_URL, crudListName, itemId);
            console.log(`  Read item ${itemId}: ${item.Title}`);

            // UPDATE
            console.log("Updating item...");
            await client.patchItem(
                { Title: "Updated by SDK" },
                SITE_URL,
                crudListName,
                itemId,
            );
            const updated = await client.getItem(SITE_URL, crudListName, itemId);
            console.log(`  Updated item ${itemId}: ${updated.Title}`);

            // DELETE
            console.log("Deleting item...");
            await client.deleteItem(SITE_URL, crudListName, itemId);
            console.log(`  Deleted item ${itemId}`);

            console.log("Full CRUD cycle completed successfully!");
        } catch (error) {
            if (error instanceof ConnectorError) {
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
        await client.getItems(SITE_URL, "NonExistentList_12345");
        console.log("Unexpected success.");
    } catch (error) {
        if (error instanceof ConnectorError) {
            console.log("Expected error caught:");
            console.log(`  Message: ${error.message}`);
            console.log(`  Status: ${error.statusCode}`);
        } else {
            console.log(`Unexpected error type: ${(error)?.constructor?.name}`);
        }
    }

    console.log("\n" + "=".repeat(55));
    console.log("Sample completed!");
}

main().catch(console.error);
