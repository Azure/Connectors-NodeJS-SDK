// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Insightly Connector SDK Sample — CJS JavaScript
 *
 * Demonstrates using the Insightly connector with CommonJS require() in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:INSIGHTLY_CONNECTION_URL = "https://[region].azure-apihub.net/apim/insightly/[connection-id]"
 *
 *   Run:
 *     npm start
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { InsightlyClient } = require("@azure/connectors/generated/InsightlyExtensions");

const CONNECTION_URL = process.env.INSIGHTLY_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: INSIGHTLY_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
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
