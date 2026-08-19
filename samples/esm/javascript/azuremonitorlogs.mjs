// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Azure Monitor Logs Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates how to use the Azure Monitor Logs connector with ESM imports in plain JavaScript.
 *
 * Prerequisites:
 *   1. Azure subscription with Azure Monitor Logs connection via AI Gateway
 *   2. Connection runtime URL from Azure Portal
 *   3. npm install in this folder
 *
 * Usage:
 *   Set environment variables:
 *     $env:AZUREMONITOR_CONNECTION_URL = "https://[region].azure-apihub.net/apim/azuremonitorlogs/[connection-id]"
 *     $env:AZUREMONITOR_SUBSCRIPTIONS = "your-subscription-id"
 *     $env:AZUREMONITOR_RESOURCE_GROUPS = "your-resource-group"
 *
 *   Run:
 *     npm start
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { AzuremonitorlogsClient } from "@azure/connectors/generated/AzuremonitorlogsExtensions";

const CONNECTION_URL = process.env.AZUREMONITOR_CONNECTION_URL ?? "";
const SUBSCRIPTIONS = process.env.AZUREMONITOR_SUBSCRIPTIONS ?? "";
const RESOURCE_GROUPS = process.env.AZUREMONITOR_RESOURCE_GROUPS ?? "";

if (!CONNECTION_URL) {
    console.error("Error: AZUREMONITOR_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    console.log("Azure Monitor Logs Connector SDK — ESM JavaScript Sample");
    console.log("=".repeat(55));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new AzuremonitorlogsClient(CONNECTION_URL, tokenProvider);

    // Example 1: Run a KQL query
    const kqlQuery = process.env.AZUREMONITOR_QUERY ?? "Heartbeat | summarize count() by Computer | take 5";
    console.log("\n--- Run KQL Query ---");
    console.log(`Query: ${kqlQuery}`);
    try {
        const input = {
            query: kqlQuery,
            timerangetype: "Last 24 hours",
            timerange: {},
        };

        const result = await client.queryDataAsync(
            input,
            SUBSCRIPTIONS || undefined,
            RESOURCE_GROUPS || undefined,
        );

        const rows = result.value ?? [];
        if (rows.length > 0) {
            console.log(`Returned ${rows.length} rows:`);
            for (const row of rows.slice(0, 10)) {
                console.log(`  ${JSON.stringify(row)}`);
            }
        } else {
            console.log("Result:", JSON.stringify(result, null, 2));
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: Visualize a query
    console.log("\n--- Visualize Query ---");
    try {
        const visInput = {
            query: "Heartbeat | summarize count() by Computer | take 10",
            timerangetype: "Last 24 hours",
            timerange: {},
        };

        const visResult = await client.visualizeQueryAsync(
            visInput,
            SUBSCRIPTIONS || undefined,
            RESOURCE_GROUPS || undefined,
            undefined,
            undefined,
            "piechart",
        );
        const visRecord = visResult;
        console.log("Visualization result keys:", Object.keys(visRecord).join(", "));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    console.log("\n" + "=".repeat(55));
    console.log("Sample completed!");
}

main().catch(console.error);
