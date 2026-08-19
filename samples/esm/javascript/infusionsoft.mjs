// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Infusionsoft Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates using the Infusionsoft connector with ESM imports in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:INFUSIONSOFT_CONNECTION_URL = "https://[region].azure-apihub.net/apim/infusionsoft/[connection-id]"
 *
 *   Run:
 *     npm start
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { InfusionsoftClient } from "@azure/connectors/generated/InfusionsoftExtensions";

const CONNECTION_URL = process.env.INFUSIONSOFT_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: INFUSIONSOFT_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new InfusionsoftClient(CONNECTION_URL, tokenProvider);

    // Example 1: Create a task.
    try {
        const task = await client.createTaskAsync({ title: "Follow up with lead" });
        console.log("Task:", JSON.stringify(task, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
