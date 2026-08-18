// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Kusto (Azure Data Explorer) Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates how to use the Kusto connector with ESM imports in TypeScript.
 *
 * Prerequisites:
 *   1. Azure subscription with Kusto connection via AI Gateway
 *   2. Connection runtime URL from Azure Portal
 *   3. Kusto cluster and database names
 *   4. npm install in this folder
 *
 * Usage:
 *   Set environment variables:
 *     $env:KUSTO_CONNECTION_URL = "https://[region].azure-apihub.net/apim/kusto/[connection-id]"
 *     $env:KUSTO_CLUSTER = "mycluster"
 *     $env:KUSTO_DATABASE = "mydb"
 *
 *   Run with tsx (dev):
 *     npx tsx kusto.ts
 *
 *   Or compile and run:
 *     npm run build
 *     node dist/kusto.js
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { KustoClient, Table, QueryAndListSchema, ControlCommandAndListSchema, ClusterName, Query, DatabaseName } from "@azure/connectors/generated/KustoExtensions";

const CONNECTION_URL = process.env.KUSTO_CONNECTION_URL ?? "";
const CLUSTER = process.env.KUSTO_CLUSTER ?? "";
const DATABASE = process.env.KUSTO_DATABASE ?? "";

if (!CONNECTION_URL) {
    console.error("Error: KUSTO_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

if (!CLUSTER || !DATABASE) {
    console.error("Error: KUSTO_CLUSTER and KUSTO_DATABASE environment variables must be set.");
    process.exit(1);
}

async function main(): Promise<void> {
    console.log("Kusto (Azure Data Explorer) Connector SDK — ESM TypeScript Sample");
    console.log("=".repeat(65));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new KustoClient(CONNECTION_URL, tokenProvider);

    // Example 1: Run a KQL query
    const kqlQuery = process.env.KUSTO_QUERY ?? `print Message="Hello from Kusto SDK", Timestamp=now()`;
    console.log("\n--- Run KQL Query ---");
    console.log(`Query: ${kqlQuery}`);
    try {
        const input: QueryAndListSchema = {
            cluster: CLUSTER as unknown as ClusterName,
            csl: kqlQuery as unknown as Query,
            db: DATABASE as unknown as DatabaseName,
        };
        const result: Table = await client.listKustoResultsAsync(input);

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

    // Example 2: Run a show control command
    console.log("\n--- Run Show Control Command ---");
    try {
        const controlInput: ControlCommandAndListSchema = {
            cluster: CLUSTER as unknown as ClusterName,
            csl: ".show databases",
            db: DATABASE as unknown as DatabaseName,
        };
        const controlResult: Table = await client.listKustoShowCommandResultsAsync(controlInput);

        const controlRows = controlResult.value ?? [];
        if (controlRows.length > 0) {
            console.log(`Found ${controlRows.length} databases:`);
            for (const row of controlRows.slice(0, 10)) {
                const rowRecord = row as Record<string, unknown>;
                console.log(`  - ${rowRecord.DatabaseName ?? rowRecord.Name ?? JSON.stringify(row)}`);
            }
        } else {
            console.log("Result:", JSON.stringify(controlResult, null, 2));
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 3: Error handling with bad query
    console.log("\n--- Error Handling ---");
    try {
        const badInput: QueryAndListSchema = {
            cluster: CLUSTER as unknown as ClusterName,
            csl: "INVALID_QUERY_!!!" as unknown as Query,
            db: DATABASE as unknown as DatabaseName,
        };
        await client.listKustoResultsAsync(badInput);
        console.log("Unexpected success.");
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log("Expected error caught:");
            console.log(`  Message: ${error.message}`);
            console.log(`  Status: ${error.statusCode}`);
        } else {
            console.log(`Unexpected error type: ${(error as Error)?.constructor?.name}`);
        }
    }

    console.log("\n" + "=".repeat(65));
    console.log("Sample completed!");
}

main().catch(console.error);
