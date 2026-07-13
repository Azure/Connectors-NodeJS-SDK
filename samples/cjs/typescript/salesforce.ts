// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Salesforce Connector SDK Sample - CJS TypeScript
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { SalesforceClient, TablesList } from "@azure/connectors/generated/SalesforceExtensions";

const CONNECTION_URL = process.env.SALESFORCE_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: SALESFORCE_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new SalesforceClient(CONNECTION_URL, tokenProvider);

    try {
        const result: TablesList = await client.getTablesAsync();
        const tables = (result.value ?? []) as Array<Record<string, unknown>>;
        console.log(`Table count: ${tables.length}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
