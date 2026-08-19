// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * SendGrid Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates using the SendGrid connector with ESM imports in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:SENDGRID_CONNECTION_URL = "https://[region].azure-apihub.net/apim/sendgrid/[connection-id]"
 *     $env:SENDGRID_EMAIL          = "[optional suppressed email address to look up]"
 *
 *   Run with tsx (dev):
 *     npx tsx sendgrid.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { SendgridClient } from "@azure/connectors/generated/SendgridExtensions";

const CONNECTION_URL = process.env.SENDGRID_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: SENDGRID_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new SendgridClient(CONNECTION_URL, tokenProvider);

    // Example 1: Look up a global suppression by email address.
    const email = process.env.SENDGRID_EMAIL ?? "user@example.com";
    try {
        const suppression = await client.getGlobalSuppressionAsync(email);
        console.log("Global suppression:", JSON.stringify(suppression, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
