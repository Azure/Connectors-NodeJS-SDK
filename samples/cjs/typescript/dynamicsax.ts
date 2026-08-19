// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Fin & Ops Apps (Dynamics 365) Connector SDK Sample — CJS TypeScript
 *
 * Demonstrates using the Fin & Ops Apps (Dynamics 365) connector with CommonJS module output in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:DYNAMICSAX_CONNECTION_URL = "https://[region].azure-apihub.net/apim/dynamicsax/[connection-id]"
 *     $env:DYNAMICSAX_TABLE          = "[optional table name to list]"
 *
 *   Run with tsx (dev):
 *     npx tsx dynamicsax.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { DynamicsaxClient } from "@azure/connectors/generated/DynamicsaxExtensions";

const CONNECTION_URL = process.env.DYNAMICSAX_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: DYNAMICSAX_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new DynamicsaxClient(CONNECTION_URL, tokenProvider);

    // Example 1: List items from a table in the default dataset.
    const table = process.env.DYNAMICSAX_TABLE ?? "Customers";
    try {
        const items = await client.getItemsAsync("default", table);
        console.log("Items:", JSON.stringify(items, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
