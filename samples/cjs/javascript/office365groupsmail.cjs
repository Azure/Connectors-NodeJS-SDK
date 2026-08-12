// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Office 365 Groups Mail Connector SDK Sample — CJS JavaScript
 *
 * Demonstrates using the Office 365 Groups Mail connector with CommonJS require() in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:OFFICE365GROUPSMAIL_CONNECTION_URL = "https://[region].azure-apihub.net/apim/office365groupsmail/[connection-id]"
 *     $env:OFFICE365GROUPSMAIL_GROUP_ID = "[group id]"
 *
 *   Run:
 *     npm start
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { Office365groupsmailClient } = require("@azure/connectors/generated/Office365groupsmailExtensions");

const CONNECTION_URL = process.env.OFFICE365GROUPSMAIL_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: OFFICE365GROUPSMAIL_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new Office365groupsmailClient(CONNECTION_URL, tokenProvider);

    const groupId = process.env.OFFICE365GROUPSMAIL_GROUP_ID;
    if (!groupId) {
        console.log("Set OFFICE365GROUPSMAIL_GROUP_ID to list a group's conversations.");
        return;
    }

    // Example: List conversations in a group's mailbox.
    try {
        const conversations = await client.listConversationsAsync(groupId);
        console.log("Conversations:", JSON.stringify(conversations, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
