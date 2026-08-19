// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Insightly Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates using the Insightly connector with ESM imports in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:INSIGHTLY_CONNECTION_URL = "https://[region].azure-apihub.net/apim/insightly/[connection-id]"
 *
 *   Run with tsx (dev):
 *     npx tsx insightly.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { InsightlyClient } from "@azure/connectors/generated/InsightlyExtensions";

const CONNECTION_URL = process.env.INSIGHTLY_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: INSIGHTLY_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new InsightlyClient(CONNECTION_URL, tokenProvider);

    // Example 1: List the tasks.
    try {
        const tasks = await client.listTasksAsync();
        console.log("Tasks:", JSON.stringify(tasks, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
