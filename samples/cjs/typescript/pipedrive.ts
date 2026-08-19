// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Pipedrive Connector SDK Sample — CJS TypeScript
 *
 * Demonstrates using the Pipedrive connector with CommonJS module output in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:PIPEDRIVE_CONNECTION_URL = "https://[region].azure-apihub.net/apim/pipedrive/[connection-id]"
 *     $env:PIPEDRIVE_DEAL_ID        = "[optional deal id to retrieve]"
 *
 *   Run with tsx (dev):
 *     npx tsx pipedrive.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { PipedriveClient } from "@azure/connectors/generated/PipedriveExtensions";

const CONNECTION_URL = process.env.PIPEDRIVE_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: PIPEDRIVE_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
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
