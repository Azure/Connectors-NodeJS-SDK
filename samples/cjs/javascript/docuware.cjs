// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * DocuWare Connector SDK Sample — CJS JavaScript
 *
 * Demonstrates using the DocuWare connector with CommonJS require() in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:DOCUWARE_CONNECTION_URL = "https://[region].azure-apihub.net/apim/docuware/[connection-id]"
 *
 *   Run:
 *     npm start
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { DocuwareClient } = require("@azure/connectors/generated/DocuwareExtensions");

const CONNECTION_URL = process.env.DOCUWARE_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: DOCUWARE_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new DocuwareClient(CONNECTION_URL, tokenProvider);

    // Example 1: Retrieve the organization details.
    try {
        const organization = await client.getOrganizationAsync();
        console.log("Organization:", JSON.stringify(organization, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
