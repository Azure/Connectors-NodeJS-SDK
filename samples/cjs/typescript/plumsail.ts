// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Plumsail Documents Connector SDK Sample — CJS TypeScript
 *
 * Demonstrates using the Plumsail Documents connector with CommonJS module output in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:PLUMSAIL_CONNECTION_URL = "https://[region].azure-apihub.net/apim/plumsail/[connection-id]"
 *
 *   Run with tsx (dev):
 *     npx tsx plumsail.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { PlumsailClient } from "@azure/connectors/generated/PlumsailExtensions";

const CONNECTION_URL = process.env.PLUMSAIL_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: PLUMSAIL_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new PlumsailClient(CONNECTION_URL, tokenProvider);

    // Example 1: Retrieve the current account profile.
    try {
        const profile = await client.profilesMeGetAsync();
        console.log("Profile:", JSON.stringify(profile, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
