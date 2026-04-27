// Copyright (c) Microsoft Corporation. All rights reserved.

/**
 * SharePoint Online Connector SDK Sample
 *
 * This sample demonstrates how to use the SharePoint Online connector SDK for TypeScript.
 *
 * Prerequisites:
 * 1. Azure subscription with SharePoint Online connection
 * 2. SharePoint Online connection in Azure Logic Apps
 * 3. Connection runtime URL from Azure Portal
 * 4. SharePoint site URL
 *
 * Installation:
 *     npm install @azure/azure-connectors
 *
 * Usage:
 *     Set environment variables:
 *     $env:SHAREPOINT_CONNECTION_URL = "https://[region].azure-apihub.net/apim/sharepointonline/[connection-id]"
 *     $env:SHAREPOINT_SITE_URL = "https://[tenant].sharepoint.com/sites/[site-name]"
 *
 *     npx ts-node sampleSharepoint.ts
 */

import { DefaultAzureCredential } from "@azure/identity";
import {
    SharepointonlineClient,
    SharepointonlineConnectorError,
} from "@azure/azure-connectors/generated/SharepointonlineExtensions";

// Connection runtime URL format:
// https://[region].azure-apihub.net/apim/sharepointonline/[connection-id]
const CONNECTION_RUNTIME_URL = process.env.SHAREPOINT_CONNECTION_URL ?? "";

// SharePoint site URL format:
// https://[tenant].sharepoint.com/sites/[site-name]
const SHAREPOINT_SITE_URL = process.env.SHAREPOINT_SITE_URL ?? "";

function createClient(): SharepointonlineClient {
    const credential = new DefaultAzureCredential();

    return new SharepointonlineClient({
        connectionRuntimeUrl: CONNECTION_RUNTIME_URL,
        getToken: async () => {
            const token = await credential.getToken("https://logic-apis-westus.azure-apihub.net/.default");
            return token.token;
        },
    });
}

async function example1GetLists(): Promise<void> {
    console.log("\n=== Example 1: Get Lists and Libraries ===");

    const client = createClient();

    try {
        const lists = await client.getTablesAsync(SHAREPOINT_SITE_URL) as Record<string, unknown>;
        const listValues = (lists?.value ?? []) as Array<Record<string, unknown>>;

        if (listValues.length > 0) {
            console.log(`Found ${listValues.length} lists and libraries:`);
            for (const listItem of listValues.slice(0, 5)) {
                console.log(`  - ${listItem.DisplayName ?? "Unknown"} (${listItem.Name ?? "Unknown"})`);
            }
        } else {
            console.log("No lists found or unexpected response format.");
        }
    } catch (error) {
        if (error instanceof SharepointonlineConnectorError) {
            console.log(`Connector error: ${error.message}`);
        } else {
            console.log(`Error: ${error}`);
        }
    }
}

async function example2GetListItems(): Promise<void> {
    console.log("\n=== Example 2: Get List Items ===");

    const listName = process.env.TEST_LIST_NAME ?? "Tasks";

    const client = createClient();

    try {
        const items = await client.getItemsAsync(SHAREPOINT_SITE_URL, listName) as Record<string, unknown>;
        const itemValues = (items?.value ?? []) as Array<Record<string, unknown>>;

        if (itemValues.length > 0) {
            console.log(`Found ${itemValues.length} items in '${listName}' list:`);
            for (const item of itemValues) {
                const title = (item as Record<string, unknown>).Title ?? "No Title";
                const itemId = (item as Record<string, unknown>).Id ?? "Unknown";
                console.log(`  - [${itemId}] ${title}`);
            }
        } else {
            console.log(`No items found in '${listName}' list.`);
            console.log("Note: Set TEST_LIST_NAME environment variable to query a different list");
        }
    } catch (error) {
        if (error instanceof SharepointonlineConnectorError) {
            console.log(`Connector error: ${error.message}`);
            if (error.statusCode === 404) {
                console.log(`Hint: List '${listName}' may not exist. Check the list name.`);
            }
        } else {
            console.log(`Error: ${error}`);
        }
    }
}

async function example3CreateListItem(): Promise<void> {
    console.log("\n=== Example 3: Create List Item ===");

    const listName = process.env.TEST_LIST_NAME ?? "Tasks";

    const client = createClient();

    try {
        const newItem = {
            Title: "Test Task from TypeScript SDK",
        };

        const created = await client.postItemAsync(newItem, SHAREPOINT_SITE_URL, listName);

        const createdRecord = created as Record<string, unknown>;
        if (createdRecord?.Id) {
            const itemId = String(createdRecord.Id);
            console.log(`Created item successfully with ID: ${itemId}`);
            console.log(`Title: ${createdRecord.Title ?? "N/A"}`);

            // Clean up: delete the item we just created
            await client.deleteItemAsync(SHAREPOINT_SITE_URL, listName, itemId);
            console.log(`Cleaned up: Deleted test item ${itemId}`);
        } else {
            console.log("Item created but no ID returned.");
        }
    } catch (error) {
        if (error instanceof SharepointonlineConnectorError) {
            console.log(`Connector error: ${error.message}`);
            if (error.statusCode === 404) {
                console.log(`Hint: List '${listName}' may not exist.`);
            }
        } else {
            console.log(`Error: ${error}`);
        }
    }
}

async function example4UpdateListItem(): Promise<void> {
    console.log("\n=== Example 4: Update List Item (Full CRUD) ===");

    const listName = process.env.TEST_LIST_NAME ?? "Tasks";

    const client = createClient();

    try {
        // CREATE
        console.log("Creating item...");
        const newItem = {
            Title: "Task to Update",
        };
        const created = await client.postItemAsync(newItem, SHAREPOINT_SITE_URL, listName);
        const createdRecord = created as Record<string, unknown>;
        const itemId = String(createdRecord.Id);
        console.log(`  Created item ${itemId}: ${createdRecord.Title}`);

        // READ
        console.log("Reading item...");
        const item = await client.getItemAsync(SHAREPOINT_SITE_URL, listName, itemId);
        const itemRecord = item as Record<string, unknown>;
        console.log(`  Read item ${itemId}: ${itemRecord.Title}`);

        // UPDATE
        console.log("Updating item...");
        const updates = {
            Title: "Updated Task Title",
        };
        await client.patchItemAsync(updates, SHAREPOINT_SITE_URL, listName, itemId);

        // Verify update
        const updated = await client.getItemAsync(SHAREPOINT_SITE_URL, listName, itemId);
        const updatedRecord = updated as Record<string, unknown>;
        console.log(`  Updated item ${itemId}: ${updatedRecord.Title}`);

        // DELETE
        console.log("Deleting item...");
        await client.deleteItemAsync(SHAREPOINT_SITE_URL, listName, itemId);
        console.log(`  Deleted item ${itemId}`);

        console.log("Full CRUD cycle completed successfully!");
    } catch (error) {
        if (error instanceof SharepointonlineConnectorError) {
            console.log(`Connector error: ${error.message}`);
        } else {
            console.log(`Error: ${error}`);
        }
    }
}

async function example5GetFileMetadata(): Promise<void> {
    console.log("\n=== Example 5: Get File Metadata ===");

    const client = createClient();

    try {
        const libraryName = process.env.TEST_LIBRARY_NAME ?? "Documents";

        const files = await client.getFileItemsAsync(SHAREPOINT_SITE_URL, libraryName) as Record<string, unknown>;
        const fileValues = (files?.value ?? []) as Array<Record<string, unknown>>;

        if (fileValues.length > 0) {
            console.log(`Found ${fileValues.length} files in '${libraryName}':`);
            for (const file of fileValues.slice(0, 5)) {
                const fileRecord = file as Record<string, unknown>;
                console.log(`  - ${fileRecord.FileLeafRef ?? fileRecord.Title ?? "Unknown"}`);
                console.log(`    ID: ${fileRecord.Id ?? "Unknown"}`);
            }
        } else {
            console.log(`No files found in '${libraryName}' library.`);
        }
    } catch (error) {
        if (error instanceof SharepointonlineConnectorError) {
            console.log(`Connector error: ${error.message}`);
        } else {
            console.log(`Error: ${error}`);
        }
    }
}

async function example6ErrorHandling(): Promise<void> {
    console.log("\n=== Example 6: Error Handling ===");

    const client = createClient();

    try {
        const nonExistentList = "NonExistentList_12345";
        const items = await client.getItemsAsync(SHAREPOINT_SITE_URL, nonExistentList);
        console.log(`Unexpected success: ${JSON.stringify(items)}`);
    } catch (error) {
        if (error instanceof SharepointonlineConnectorError) {
            console.log("Expected error caught:");
            console.log(`  Message: ${error.message}`);
            console.log(`  Status: ${error.statusCode}`);
        } else {
            console.log(`Unexpected error type: ${(error as Error).constructor.name}`);
            console.log(`  Message: ${error}`);
        }
    }
}

async function main(): Promise<void> {
    console.log("SharePoint Online Connector SDK - Sample Usage");
    console.log("=".repeat(50));

    await example1GetLists();
    await example2GetListItems();
    await example3CreateListItem();
    await example4UpdateListItem();
    await example5GetFileMetadata();
    await example6ErrorHandling();

    console.log("\n" + "=".repeat(50));
    console.log("Sample completed!");
}

main().catch(console.error);
