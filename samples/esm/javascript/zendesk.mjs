// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Zendesk Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates using the Zendesk connector with ESM imports in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:ZENDESK_CONNECTION_URL = "https://[region].azure-apihub.net/apim/zendesk/[connection-id]"
 *     $env:ZENDESK_TABLE          = "[optional table name]"
 *
 *   Run:
 *     npm start
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { ZendeskClient } from "@azure/connectors/generated/ZendeskExtensions";

const CONNECTION_URL = process.env.ZENDESK_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: ZENDESK_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new ZendeskClient(CONNECTION_URL, tokenProvider);

    // Example 1: List the available tables.
    try {
        const tables = await client.getTablesAsync();
        console.log("Tables:", JSON.stringify(tables, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: List items in a table (requires ZENDESK_TABLE).
    const table = process.env.ZENDESK_TABLE;
    if (table) {
        try {
            const items = await client.getItemsAsync(table);
            console.log(`Retrieved items from table '${table}'.`);
            console.log(JSON.stringify(items, null, 2));
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }
    } else {
        console.log("Set ZENDESK_TABLE to list items from a table.");
    }
}

main().catch(console.error);
