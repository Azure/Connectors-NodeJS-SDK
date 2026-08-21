// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Projectplace Connector SDK Sample — CJS TypeScript
 *
 * Demonstrates using the Projectplace connector with CommonJS module output in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:PROJECTPLACE_CONNECTION_URL = "https://[region].azure-apihub.net/apim/projectplace/[connection-id]"
 *     $env:PROJECTPLACE_BOARD_ID       = "[required numeric board id]"
 *
 *   Run with tsx (dev):
 *     npx tsx projectplace.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { ProjectplaceClient } from "@azure/connectors/generated/ProjectplaceExtensions";

const CONNECTION_URL = process.env.PROJECTPLACE_CONNECTION_URL ?? "";
const BOARD_ID = process.env.PROJECTPLACE_BOARD_ID ?? "";

if (!CONNECTION_URL) {
    console.error("Error: PROJECTPLACE_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

if (!/^\d+$/.test(BOARD_ID)) {
    console.error("Error: PROJECTPLACE_BOARD_ID environment variable must be set to a numeric value.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new ProjectplaceClient(CONNECTION_URL, tokenProvider);

    // Example 1: Create a card on a board.
    try {
        const card = await client.createCardAsync({ title: "Design review" }, BOARD_ID);
        console.log("Card:", JSON.stringify(card, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
