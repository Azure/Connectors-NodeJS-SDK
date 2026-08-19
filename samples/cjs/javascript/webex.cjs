// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Webex Connector SDK Sample — CJS JavaScript
 *
 * Demonstrates using the Webex connector with CommonJS require() in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:WEBEX_CONNECTION_URL = "https://[region].azure-apihub.net/apim/webex/[connection-id]"
 *
 *   Run:
 *     npm start
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { WebexClient } = require("@azure/connectors/generated/WebexExtensions");

const CONNECTION_URL = process.env.WEBEX_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: WEBEX_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new WebexClient(CONNECTION_URL, tokenProvider);

    // Example 1: List the messages.
    try {
        const messages = await client.getMessagesAsync();
        console.log("Messages:", JSON.stringify(messages, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
