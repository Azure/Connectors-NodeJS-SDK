// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Text Request Connector SDK Sample — CJS JavaScript
 *
 * Demonstrates using the Text Request connector with CommonJS require() in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:TEXTREQUEST_CONNECTION_URL = "https://[region].azure-apihub.net/apim/textrequest/[connection-id]"
 *     $env:TEXTREQUEST_DASHBOARD_ID   = "[optional dashboard id]"
 *     $env:TEXTREQUEST_PHONE          = "[optional contact phone number]"
 *
 *   Run:
 *     npm start
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { TextrequestClient } = require("@azure/connectors/generated/TextrequestExtensions");

const CONNECTION_URL = process.env.TEXTREQUEST_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: TEXTREQUEST_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new TextrequestClient(CONNECTION_URL, tokenProvider);

    // Example 1: List messages exchanged with a contact phone number.
    const dashboardId = process.env.TEXTREQUEST_DASHBOARD_ID ?? "dash123";
    const phoneNumber = process.env.TEXTREQUEST_PHONE ?? "+15555550100";
    try {
        const messages = await client.getMessagesByContactPhoneAsync(dashboardId, phoneNumber);
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
