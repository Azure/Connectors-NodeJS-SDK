// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Webex Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates using the Webex connector with ESM imports in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:WEBEX_CONNECTION_URL = "https://[region].azure-apihub.net/apim/webex/[connection-id]"
 *     $env:WEBEX_ROOM_ID        = "[Webex space/room id to list messages from]"
 *
 *   Run with tsx (dev):
 *     npx tsx webex.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { WebexClient } from "@azure/connectors/generated/WebexExtensions";

const CONNECTION_URL = process.env.WEBEX_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: WEBEX_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new WebexClient(CONNECTION_URL, tokenProvider);

    // Example 1: List messages in a Webex space (a room ID is required).
    const roomId = process.env.WEBEX_ROOM_ID ?? "sample-room-id";
    try {
        const messages = await client.getMessagesAsync(roomId);
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
