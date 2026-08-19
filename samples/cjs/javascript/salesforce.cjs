// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Salesforce Connector SDK Sample - CJS JavaScript
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { SalesforceClient } = require("@azure/connectors/generated/SalesforceExtensions");

const CONNECTION_URL = process.env.SALESFORCE_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: SALESFORCE_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new SalesforceClient(CONNECTION_URL, tokenProvider);

    try {
        const result = await client.getTablesAsync();
        const tables = (result.value ?? []);
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
