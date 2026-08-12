// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Shifts Connector SDK Sample - CJS JavaScript
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { ShiftsClient } = require("@azure/connectors/generated/ShiftsExtensions");

const CONNECTION_URL = process.env.SHIFTS_CONNECTION_URL ?? "";
const SHIFTS_TEAM_ID = process.env.SHIFTS_TEAM_ID ?? "replace-with-team-id";

if (!CONNECTION_URL) {
    console.error("Error: SHIFTS_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new ShiftsClient(CONNECTION_URL, tokenProvider);

    try {
        const result = await client.getScheduleAsync(SHIFTS_TEAM_ID);
        console.log(`Schedule keys: ${Object.keys(result).join(", ")}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
