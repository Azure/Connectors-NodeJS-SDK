// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Ticketmaster Connector SDK Sample - CJS TypeScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { TicketmasterClient } from "@azure/connectors/generated/TicketmasterExtensions";
const CONNECTION_URL = process.env.TICKETMASTER_CONNECTION_URL ?? "";
const EVENT_ID = process.env.TICKETMASTER_EVENT_ID ?? "";
if (!CONNECTION_URL || !EVENT_ID) throw new Error("TICKETMASTER_CONNECTION_URL and TICKETMASTER_EVENT_ID are required.");
async function main(): Promise<void> {
    try {
        const event = await new TicketmasterClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).eventGetAsync(EVENT_ID);
        console.log("Event:", JSON.stringify(event, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);