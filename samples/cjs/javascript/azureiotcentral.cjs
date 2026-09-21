// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Azure IoT Central Connector SDK Sample — CJS JavaScript
 *
 * Demonstrates using the Azure IoT Central connector with CommonJS require() in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:AZUREIOTCENTRAL_CONNECTION_URL = "https://[region].azure-apihub.net/apim/azureiotcentral/[connection-id]"
 *
 *   Run:
 *     npm start
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorError } = require("@azure/connectors");
const { AzureiotcentralClient } = require("@azure/connectors/generated/AzureiotcentralExtensions");

const CONNECTION_URL = process.env.AZUREIOTCENTRAL_CONNECTION_URL ?? "";
const APPLICATION_ID = process.env.AZUREIOTCENTRAL_APPLICATION_ID ?? "";

if (!CONNECTION_URL) {
    console.error("Error: AZUREIOTCENTRAL_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

if (!APPLICATION_ID) {
    console.error("Error: AZUREIOTCENTRAL_APPLICATION_ID environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new AzureiotcentralClient(CONNECTION_URL, tokenProvider);

    // Example 1: List the device groups in the application.
    try {
        let deviceGroupCount = 0;
        for await (const deviceGroup of client.listDeviceGroups(APPLICATION_ID)) {
            console.log("Device group:", JSON.stringify(deviceGroup, null, 2));
            deviceGroupCount++;
        }

        console.log(`Device groups found: ${deviceGroupCount}`);
    } catch (error) {
        if (error instanceof ConnectorError) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
