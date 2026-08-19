// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Google Calendar Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates using the Google Calendar connector with ESM imports in TypeScript.
 *
 * Usage:
 *   Set environment variable:
 *     $env:GOOGLECALENDAR_CONNECTION_URL = "https://[region].azure-apihub.net/apim/googlecalendar/[connection-id]"
 *
 *   Run with tsx (dev):
 *     npx tsx googlecalendar.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { GooglecalendarClient } from "@azure/connectors/generated/GooglecalendarExtensions";

const CONNECTION_URL = process.env.GOOGLECALENDAR_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: GOOGLECALENDAR_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new GooglecalendarClient(CONNECTION_URL, tokenProvider);

    // Example: List the calendars available to the connection.
    try {
        const calendars = await client.listCalendarsAsync();
        console.log("Calendars:", JSON.stringify(calendars, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
