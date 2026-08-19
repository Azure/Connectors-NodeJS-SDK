// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Campfire Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates using the Campfire connector with ESM imports in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:CAMPFIRE_CONNECTION_URL = "https://[region].azure-apihub.net/apim/campfire/[connection-id]"
 *     $env:CAMPFIRE_USER_ID        = "[optional user id to retrieve]"
 *
 *   Run with tsx (dev):
 *     npx tsx campfire.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { CampfireClient } from "@azure/connectors/generated/CampfireExtensions";

const CONNECTION_URL = process.env.CAMPFIRE_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: CAMPFIRE_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new CampfireClient(CONNECTION_URL, tokenProvider);

    // Example 1: Retrieve a user by id.
    const userId = process.env.CAMPFIRE_USER_ID ?? "user123";
    try {
        const user = await client.getUserAsync(userId);
        console.log("User:", JSON.stringify(user, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
