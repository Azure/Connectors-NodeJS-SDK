// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Campfire Connector SDK Sample — CJS JavaScript
 *
 * Demonstrates using the Campfire connector with CommonJS require() in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:CAMPFIRE_CONNECTION_URL = "https://[region].azure-apihub.net/apim/campfire/[connection-id]"
 *     $env:CAMPFIRE_USER_ID        = "[required numeric user id to retrieve]"
 *
 *   Run:
 *     npm start
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { CampfireClient } = require("@azure/connectors/generated/CampfireExtensions");

const CONNECTION_URL = process.env.CAMPFIRE_CONNECTION_URL ?? "";
const USER_ID = process.env.CAMPFIRE_USER_ID ?? "";

if (!CONNECTION_URL) {
    console.error("Error: CAMPFIRE_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

if (!/^\d+$/.test(USER_ID)) {
    console.error("Error: CAMPFIRE_USER_ID environment variable must be set to a numeric value.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new CampfireClient(CONNECTION_URL, tokenProvider);

    // Example 1: Retrieve a user by id.
    try {
        const user = await client.getUserAsync(USER_ID);
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
