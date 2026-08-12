// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Power BI Connector SDK Sample - CJS JavaScript
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { PowerbiClient } = require("@azure/connectors/generated/PowerbiExtensions");

const CONNECTION_URL = process.env.POWERBI_CONNECTION_URL ?? "";
const POWERBI_GROUP_ID = process.env.POWERBI_GROUP_ID ?? "replace-with-group-id";

if (!CONNECTION_URL) {
    console.error("Error: POWERBI_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new PowerbiClient(CONNECTION_URL, tokenProvider);

    try {
        const result = await client.getScorecardsAsync(POWERBI_GROUP_ID, "firstparty");
        console.log(`Scorecard payload keys: ${Object.keys(result).join(", ")}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
