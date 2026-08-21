// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Azure IoT Central Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates using the Azure IoT Central connector with ESM imports in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:AZUREIOTCENTRAL_CONNECTION_URL = "https://[region].azure-apihub.net/apim/azureiotcentral/[connection-id]"
 *
 *   Run:
 *     npm start
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { AzureiotcentralClient } from "@azure/connectors/generated/AzureiotcentralExtensions";

const CONNECTION_URL = process.env.AZUREIOTCENTRAL_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: AZUREIOTCENTRAL_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new AzureiotcentralClient(CONNECTION_URL, tokenProvider);

    // Example 1: List the device groups in the application.
    try {
        const deviceGroups = await client.deviceGroupsListAsync();
        console.log("Device groups:", JSON.stringify(deviceGroups, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
