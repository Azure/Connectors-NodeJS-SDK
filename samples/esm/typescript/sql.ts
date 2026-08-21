// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * SQL Server Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates using the SQL Server connector with ESM imports in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:SQL_CONNECTION_URL = "https://[region].azure-apihub.net/apim/sql/[connection-id]"
 *     $env:SQL_SERVER         = "[optional server name]"
 *     $env:SQL_DATABASE       = "[optional database name]"
 *     $env:SQL_TABLE          = "[optional table name]"
 *     $env:SQL_ITEM_ID        = "[optional row id to retrieve]"
 *
 *   Run with tsx (dev):
 *     npx tsx sql.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { SqlClient } from "@azure/connectors/generated/SqlExtensions";

const CONNECTION_URL = process.env.SQL_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: SQL_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new SqlClient(CONNECTION_URL, tokenProvider);

    // Example 1: Retrieve a single row from a table.
    const server = process.env.SQL_SERVER ?? "server";
    const database = process.env.SQL_DATABASE ?? "database";
    const table = process.env.SQL_TABLE ?? "table";
    const itemId = process.env.SQL_ITEM_ID ?? "id123";
    try {
        const item = await client.getItemAsync(server, database, table, itemId);
        console.log("Item:", JSON.stringify(item, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
