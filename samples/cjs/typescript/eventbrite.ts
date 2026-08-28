// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Eventbrite Connector SDK Sample - CJS TypeScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { EventbriteClient } from "@azure/connectors/generated/EventbriteExtensions";
const CONNECTION_URL = process.env.EVENTBRITE_CONNECTION_URL ?? "";
const ORGANIZATION_ID = process.env.EVENTBRITE_ORGANIZATION_ID ?? "";
if (!CONNECTION_URL || !ORGANIZATION_ID) throw new Error("EVENTBRITE_CONNECTION_URL and EVENTBRITE_ORGANIZATION_ID are required.");
async function main(): Promise<void> {
    try {
        const event = await new EventbriteClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).createEventAsync(ORGANIZATION_ID);
        console.log("Event:", JSON.stringify(event, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);