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

import { ManagedIdentityTokenProvider, ConnectorError } from "@azure/connectors";
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
        let userCount = 0;
        for await (const user of client.listUsers()) {
            if (userCount < 5) {
                console.log(`  - ${String(user.displayName ?? "Unknown")} (${String(user.userPrincipalName ?? "no UPN")})`);
            }

            userCount++;
        }

        if (userCount === 0) {
            console.log("No users found.");
        } else {
            console.log(`Found ${userCount} users.`);
        }
    } catch (error) {
        if (error instanceof ConnectorError) {
            console.log(`Connector error: ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: Search groups by display name
    const searchTerm = process.env.MSGRAPH_GROUP_SEARCH ?? "Engineering";
    console.log(`\n--- Search Groups ("${searchTerm}") ---`);
    try {
        let groupCount = 0;
        for await (const group of client.listGroupsByDisplayNameSearch(searchTerm)) {
            if (groupCount < 5) {
                console.log(`  - ${String(group.displayName ?? "Unknown")} (${String(group.id ?? "no ID")})`);
            }

            groupCount++;
        }

        if (groupCount === 0) {
            console.log("No groups found.");
        } else {
            console.log(`Found ${groupCount} groups.`);
        }
    } catch (error) {
        if (error instanceof ConnectorError) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 3: List subscribed SKUs (organization licenses)
    console.log("\n--- List Subscribed SKUs ---");
    try {
        let skuCount = 0;
        for await (const sku of client.listSubscribedSkus()) {
            if (skuCount < 5) {
                console.log(`  - ${String(sku.skuPartNumber ?? "Unknown")} (consumed: ${String(sku.consumedUnits ?? "?")})`);
            }

            skuCount++;
        }

        if (skuCount === 0) {
            console.log("No SKUs found.");
        } else {
            console.log(`Found ${skuCount} subscribed SKUs.`);
        }
    } catch (error) {
        if (error instanceof ConnectorError) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("Sample completed!");
}

main().catch(console.error);
