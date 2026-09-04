// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Azure Resource Manager Connector SDK Sample — CJS TypeScript
 *
 * Demonstrates how to use the ARM connector with CommonJS module output in TypeScript.
 *
 * Prerequisites:
 *   1. Azure subscription with ARM connection via AI Gateway
 *   2. Connection runtime URL from Azure Portal
 *   3. npm install in this folder
 *
 * Usage:
 *   Set environment variables:
 *     $env:ARM_CONNECTION_URL = "https://[region].azure-apihub.net/apim/arm/[connection-id]"
 *     $env:ARM_SUBSCRIPTION_ID = "your-subscription-id"
 *
 *   Run with tsx (dev):
 *     npx tsx arm.ts
 *
 *   Or compile and run:
 *     npm run build
 *     node dist/arm.js
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { ArmClient, Subscription, LocationListResult, ResourceGroup } from "@azure/connectors/generated/ArmExtensions";

const CONNECTION_URL = process.env.ARM_CONNECTION_URL ?? "";
const SUBSCRIPTION_ID = process.env.ARM_SUBSCRIPTION_ID ?? "";

if (!CONNECTION_URL) {
    console.error("Error: ARM_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    console.log("Azure Resource Manager Connector SDK — CJS TypeScript Sample");
    console.log("=".repeat(60));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new ArmClient(CONNECTION_URL, tokenProvider);

    // Example 1: List subscriptions
    console.log("\n--- List Subscriptions ---");
    try {
        const subscriptions: Subscription[] = [];
        for await (const subscription of client.subscriptionsListAsync()) {
            subscriptions.push(subscription);
        }

        if (subscriptions.length > 0) {
            console.log(`Found ${subscriptions.length} subscriptions:`);
            for (const sub of subscriptions.slice(0, 5)) {
                console.log(`  - ${sub.displayName ?? "Unknown"} (${sub.subscriptionId})`);
            }
        } else {
            console.log("No subscriptions found.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error: ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: List locations for a subscription
    if (SUBSCRIPTION_ID) {
        console.log("\n--- List Locations ---");
        try {
            const locations: LocationListResult = await client.subscriptionsListLocationsAsync(SUBSCRIPTION_ID);
            const locs = locations.value ?? [];

            if (locs.length > 0) {
                console.log(`Found ${locs.length} locations:`);
                for (const loc of locs.slice(0, 10)) {
                    console.log(`  - ${loc.displayName ?? "Unknown"} (${loc.name})`);
                }
            } else {
                console.log("No locations found.");
            }
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }

        // Example 3: List resource groups
        console.log("\n--- List Resource Groups ---");
        try {
            const groups: ResourceGroup[] = [];
            for await (const group of client.resourceGroupsListAsync(SUBSCRIPTION_ID)) {
                groups.push(group);
            }

            if (groups.length > 0) {
                console.log(`Found ${groups.length} resource groups:`);
                for (const group of groups.slice(0, 10)) {
                    console.log(`  - ${group.name} (${group.location})`);
                }
            } else {
                console.log("No resource groups found.");
            }
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }
    } else {
        console.log("\nSkipping location and resource group examples (ARM_SUBSCRIPTION_ID not set).");
    }

    console.log("\n" + "=".repeat(60));
    console.log("Sample completed!");
}

main().catch(console.error);
