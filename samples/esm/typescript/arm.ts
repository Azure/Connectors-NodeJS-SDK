// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Azure Resource Manager Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates how to use the ARM connector with ESM imports in TypeScript.
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
import { ArmClient, SubscriptionListResult, LocationListResult } from "@azure/connectors/generated/ArmExtensions";

const CONNECTION_URL = process.env.ARM_CONNECTION_URL ?? "";
const SUBSCRIPTION_ID = process.env.ARM_SUBSCRIPTION_ID ?? "";

if (!CONNECTION_URL) {
    console.error("Error: ARM_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    console.log("Azure Resource Manager Connector SDK — ESM TypeScript Sample");
    console.log("=".repeat(60));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new ArmClient(CONNECTION_URL, tokenProvider);

    // Example 1: List subscriptions
    console.log("\n--- List Subscriptions ---");
    try {
        const subscriptions: SubscriptionListResult = await client.subscriptionsListAsync();
        const subs = subscriptions.value ?? [];

        if (subs.length > 0) {
            console.log(`Found ${subs.length} subscriptions:`);
            for (const sub of subs.slice(0, 5)) {
                const record = sub as Record<string, unknown>;
                console.log(`  - ${record.displayName ?? "Unknown"} (${record.subscriptionId})`);
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
                    const record = loc as Record<string, unknown>;
                    console.log(`  - ${record.displayName ?? "Unknown"} (${record.name})`);
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
            const groups = await client.resourceGroupsListAsync(SUBSCRIPTION_ID);
            const groupValues = (groups as Record<string, unknown>).value as Array<Record<string, unknown>> ?? [];

            if (groupValues.length > 0) {
                console.log(`Found ${groupValues.length} resource groups:`);
                for (const group of groupValues.slice(0, 10)) {
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
