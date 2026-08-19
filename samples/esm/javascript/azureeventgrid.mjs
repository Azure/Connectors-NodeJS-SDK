// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Azure Event Grid Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates using the Azure Event Grid connector with ESM imports in plain JavaScript.
 *
 * This connector is trigger-only: it has no action methods. The sample constructs
 * the client and lists the trigger operations it exposes.
 *
 * Usage:
 *   Set environment variables:
 *     $env:AZUREEVENTGRID_CONNECTION_URL = "https://[region].azure-apihub.net/apim/azureeventgrid/[connection-id]"
 *
 *   Run:
 *     npm start
 */

import { ManagedIdentityTokenProvider } from "@azure/connectors";
import { AzureeventgridClient } from "@azure/connectors/generated/AzureeventgridExtensions";

const CONNECTION_URL = process.env.AZUREEVENTGRID_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: AZUREEVENTGRID_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new AzureeventgridClient(CONNECTION_URL, tokenProvider);

    // Azure Event Grid is a trigger-only connector; report its identity and triggers.
    console.log("Connector name:", client.connectorName);
    console.log("Available trigger operations:", JSON.stringify(AzureeventgridTriggerOperations, null, 2));
}

main().catch(console.error);
