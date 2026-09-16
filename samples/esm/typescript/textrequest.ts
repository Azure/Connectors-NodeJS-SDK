// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Text Request Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates using the Text Request connector with ESM imports in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:TEXTREQUEST_CONNECTION_URL = "https://[region].azure-apihub.net/apim/textrequest/[connection-id]"
 *     $env:TEXTREQUEST_DASHBOARD_ID   = "[required numeric dashboard id]"
 *     $env:TEXTREQUEST_PHONE          = "[optional contact phone number]"
 *
 *   Run with tsx (dev):
 *     npx tsx textrequest.ts
 */

import { ManagedIdentityTokenProvider, ConnectorError } from "@azure/connectors";
import { TextrequestClient } from "@azure/connectors/generated/TextrequestExtensions";

const CONNECTION_URL = process.env.TEXTREQUEST_CONNECTION_URL ?? "";
const DASHBOARD_ID = process.env.TEXTREQUEST_DASHBOARD_ID ?? "";

if (!CONNECTION_URL) {
    console.error("Error: TEXTREQUEST_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

if (!/^\d+$/.test(DASHBOARD_ID)) {
    console.error("Error: TEXTREQUEST_DASHBOARD_ID environment variable must be set to a numeric value.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new TextrequestClient(CONNECTION_URL, tokenProvider);

    // Example 1: List messages exchanged with a contact phone number.
    const phoneNumber = process.env.TEXTREQUEST_PHONE ?? "+15555550100";
    try {
        const messages = await client.getMessagesByContactPhone(DASHBOARD_ID, phoneNumber, "0", "50");
        console.log("Messages:", JSON.stringify(messages, null, 2));
    } catch (error) {
        if (error instanceof ConnectorError) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
