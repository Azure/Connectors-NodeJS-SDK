// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Microsoft Graph Groups & Users Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates how to use the MS Graph Groups & Users connector with ESM imports in plain JavaScript.
 *
 * Prerequisites:
 *   1. Azure subscription with MS Graph connection via AI Gateway
 *   2. Connection runtime URL from Azure Portal
 *   3. npm install in this folder
 *
 * Usage:
 *   Set environment variable:
 *     $env:MSGRAPH_CONNECTION_URL = "https://[region].azure-apihub.net/apim/msgraphgroupsanduser/[connection-id]"
 *
 *   Run:
 *     npm start
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { MsgraphgroupsanduserClient } from "@azure/connectors/generated/MsgraphgroupsanduserExtensions";

const CONNECTION_URL = process.env.MSGRAPH_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: MSGRAPH_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    console.log("MS Graph Groups & Users Connector SDK — ESM JavaScript Sample");
    console.log("=".repeat(60));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new MsgraphgroupsanduserClient(CONNECTION_URL, tokenProvider);

    // Example 1: List users
    console.log("\n--- List Users ---");
    try {
        const usersResponse = await client.listUsersAsync();
        const users = usersResponse.value ?? [];

        if (users.length > 0) {
            console.log(`Found ${users.length} users:`);
            for (const user of users.slice(0, 5)) {
                console.log(`  - ${user.displayName ?? "Unknown"} (${user.userPrincipalName ?? "no UPN"})`);
            }
        } else {
            console.log("No users found.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error: ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: Search groups by display name
    const searchTerm = process.env.MSGRAPH_GROUP_SEARCH ?? "Engineering";
    console.log(`\n--- Search Groups ("${searchTerm}") ---`);
    try {
        const groupsResponse = await client.listGroupsByDisplayNameSearchAsync(
            searchTerm,
        );
        const groups = groupsResponse.value ?? [];

        if (groups.length > 0) {
            console.log(`Found ${groups.length} groups:`);
            for (const group of groups.slice(0, 5)) {
                console.log(`  - ${group.displayName ?? "Unknown"} (${group.id})`);
            }
        } else {
            console.log("No groups found.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 3: List subscribed SKUs (organization licenses)
    console.log("\n--- List Subscribed SKUs ---");
    try {
        const skusResponse = await client.listSubscribedSkusAsync();
        const skus = skusResponse.value ?? [];

        if (skus.length > 0) {
            console.log(`Found ${skus.length} subscribed SKUs:`);
            for (const sku of skus.slice(0, 5)) {
                console.log(`  - ${sku.skuPartNumber ?? "Unknown"} (consumed: ${sku.consumedUnits ?? "?"})`);
            }
        } else {
            console.log("No SKUs found.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("Sample completed!");
}

main().catch(console.error);
