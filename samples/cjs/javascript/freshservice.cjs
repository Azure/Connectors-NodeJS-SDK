// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Freshservice Connector SDK Sample — CJS JavaScript
 *
 * Demonstrates using the Freshservice connector with CommonJS require() in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:FRESHSERVICE_CONNECTION_URL = "https://[region].azure-apihub.net/apim/freshservice/[connection-id]"
 *
 *   Run:
 *     npm start
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { FreshserviceClient } = require("@azure/connectors/generated/FreshserviceExtensions");

const CONNECTION_URL = process.env.FRESHSERVICE_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: FRESHSERVICE_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new FreshserviceClient(CONNECTION_URL, tokenProvider);

    // Example 1: Create a support ticket.
    try {
        const ticket = await client.createTicketAsync({
            subject: "Cannot access email",
            status: "Open",
            priority: "High",
            description: "The user cannot access their email account.",
        });
        console.log("Ticket:", JSON.stringify(ticket, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
