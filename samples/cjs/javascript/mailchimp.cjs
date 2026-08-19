// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Mailchimp Connector SDK Sample — CJS JavaScript
 *
 * Demonstrates using the Mailchimp connector with CommonJS require() in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:MAILCHIMP_CONNECTION_URL = "https://[region].azure-apihub.net/apim/mailchimp/[connection-id]"
 *
 *   Run:
 *     npm start
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { MailchimpClient } = require("@azure/connectors/generated/MailchimpExtensions");

const CONNECTION_URL = process.env.MAILCHIMP_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: MAILCHIMP_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new MailchimpClient(CONNECTION_URL, tokenProvider);

    // Example 1: List the campaigns.
    try {
        const campaigns = await client.getCampaignsAsync();
        console.log("Campaigns:", JSON.stringify(campaigns, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
