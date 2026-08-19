// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Monday Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates using the Monday connector with ESM imports in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:MONDAY_CONNECTION_URL = "https://[region].azure-apihub.net/apim/monday/[connection-id]"
 *     $env:MONDAY_WORKSPACE_ID   = "[optional workspace id]"
 *     $env:MONDAY_BOARD_ID       = "[optional board id]"
 *     $env:MONDAY_GROUP_ID       = "[optional group id]"
 *
 *   Run:
 *     npm start
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { MondayClient } from "@azure/connectors/generated/MondayExtensions";

const CONNECTION_URL = process.env.MONDAY_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: MONDAY_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new MondayClient(CONNECTION_URL, tokenProvider);

    // Example 1: Create an item on a board.
    const workspaceId = process.env.MONDAY_WORKSPACE_ID ?? "ws123";
    const boardId = process.env.MONDAY_BOARD_ID ?? "board123";
    const groupId = process.env.MONDAY_GROUP_ID ?? "group123";
    try {
        const item = await client.createItemAsync({
            workspaceId,
            boardId,
            groupId,
            itemName: "New item",
        });
        console.log("Item:", JSON.stringify(item, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
