// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * ClickSend SMS Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates using the ClickSend SMS connector with ESM imports in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:CLICKSENDSMS_CONNECTION_URL = "https://[region].azure-apihub.net/apim/clicksendsms/[connection-id]"
 *
 *   Run:
 *     npm start
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { ClicksendsmsClient } from "@azure/connectors/generated/ClicksendsmsExtensions";

const CONNECTION_URL = process.env.CLICKSENDSMS_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: CLICKSENDSMS_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new ClicksendsmsClient(CONNECTION_URL, tokenProvider);

    // Example 1: List the contact lists.
    try {
        const contactLists = await client.getContactListsAsync();
        console.log("Contact lists:", JSON.stringify(contactLists, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
