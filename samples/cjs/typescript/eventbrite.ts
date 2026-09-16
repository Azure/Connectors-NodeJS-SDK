// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Eventbrite Connector SDK Sample - CJS TypeScript. */
import { ConnectorError, ManagedIdentityTokenProvider } from "@azure/connectors";
import { EventbriteClient } from "@azure/connectors/generated/EventbriteExtensions";
const CONNECTION_URL = process.env.EVENTBRITE_CONNECTION_URL ?? "";
const ORGANIZATION_ID = process.env.EVENTBRITE_ORGANIZATION_ID ?? "";
if (!CONNECTION_URL || !ORGANIZATION_ID) throw new Error("EVENTBRITE_CONNECTION_URL and EVENTBRITE_ORGANIZATION_ID are required.");
async function main(): Promise<void> {
    try {
        const startTime = new Date(Date.now() + 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        const event = await new EventbriteClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).createEvent(
            ORGANIZATION_ID,
            "Connector SDK sample event",
            "Created by the Azure Connectors Node.js SDK sample.",
            startTime.toISOString(),
            endTime.toISOString(),
            "UTC",
            "UTC",
            "USD",
        );
        console.log("Event:", JSON.stringify(event, null, 2));
    } catch (error) {
        if (error instanceof ConnectorError) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);