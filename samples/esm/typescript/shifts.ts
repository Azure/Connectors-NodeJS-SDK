// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Shifts Connector SDK Sample - ESM TypeScript
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { ShiftsClient, ScheduleResponse } from "@azure/connectors/generated/ShiftsExtensions";

const CONNECTION_URL = process.env.SHIFTS_CONNECTION_URL ?? "";
const SHIFTS_TEAM_ID = process.env.SHIFTS_TEAM_ID ?? "replace-with-team-id";

if (!CONNECTION_URL) {
    console.error("Error: SHIFTS_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new ShiftsClient(CONNECTION_URL, tokenProvider);

    try {
        const result: ScheduleResponse = await client.getScheduleAsync(SHIFTS_TEAM_ID);
        console.log(`Schedule keys: ${Object.keys(result as Record<string, unknown>).join(", ")}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
