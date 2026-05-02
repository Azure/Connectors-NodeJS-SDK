// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Kusto (Azure Data Explorer) Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates how to use the Kusto connector with ESM imports in plain JavaScript.
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
 *   Run:
 *     npm run kusto
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/azure-connectors";
import { KustoClient } from "@azure/azure-connectors/generated/KustoExtensions";

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

async function main() {
    console.log("Kusto (Azure Data Explorer) Connector SDK — ESM JavaScript Sample");
    console.log("=".repeat(65));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new KustoClient(CONNECTION_URL, tokenProvider);

    // Example 1: Run a KQL query
    const kqlQuery = process.env.KUSTO_QUERY ?? `print Message="Hello from Kusto SDK", Timestamp=now()`;
    console.log("\n--- Run KQL Query ---");
    console.log(`Query: ${kqlQuery}`);
    try {
        const input = {
            cluster: CLUSTER,
            csl: kqlQuery,
            db: DATABASE,
        };
        const result = await client.listKustoResultsAsync(input);

        if (result?.value && Array.isArray(result.value)) {
            console.log(`Returned ${result.value.length} rows:`);
            for (const row of result.value.slice(0, 10)) {
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
        const controlInput = {
            cluster: CLUSTER,
            csl: ".show databases",
            db: DATABASE,
        };
        const controlResult = await client.listKustoShowCommandResultsAsync(controlInput);

        if (controlResult?.value && Array.isArray(controlResult.value)) {
            console.log(`Found ${controlResult.value.length} databases:`);
            for (const row of controlResult.value.slice(0, 10)) {
                console.log(`  - ${row.DatabaseName ?? row.Name ?? JSON.stringify(row)}`);
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
        const badInput = {
            cluster: CLUSTER,
            csl: "INVALID_QUERY_!!!",
            db: DATABASE,
        };
        await client.listKustoResultsAsync(badInput);
        console.log("Unexpected success.");
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log("Expected error caught:");
            console.log(`  Message: ${error.message}`);
            console.log(`  Status: ${error.statusCode}`);
        } else {
            console.log(`Unexpected error type: ${error?.constructor?.name}`);
        }
    }

    console.log("\n" + "=".repeat(65));
    console.log("Sample completed!");
}

main().catch(console.error);
