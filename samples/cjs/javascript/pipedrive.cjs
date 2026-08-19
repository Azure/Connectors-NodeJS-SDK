// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Pipedrive Connector SDK Sample — CJS JavaScript
 *
 * Demonstrates using the Pipedrive connector with CommonJS require() in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:PIPEDRIVE_CONNECTION_URL = "https://[region].azure-apihub.net/apim/pipedrive/[connection-id]"
 *     $env:PIPEDRIVE_DEAL_ID        = "[optional deal id to retrieve]"
 *
 *   Run:
 *     npm start
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { PipedriveClient } = require("@azure/connectors/generated/PipedriveExtensions");

const CONNECTION_URL = process.env.PIPEDRIVE_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: PIPEDRIVE_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new PipedriveClient(CONNECTION_URL, tokenProvider);

    // Example 1: Retrieve a deal by id.
    const dealId = process.env.PIPEDRIVE_DEAL_ID ?? "deal123";
    try {
        const deal = await client.getDealAsync(dealId);
        console.log("Deal:", JSON.stringify(deal, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
