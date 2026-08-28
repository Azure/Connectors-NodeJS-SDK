// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Meeting Room Map Connector SDK Sample - ESM TypeScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { MeetingroommapClient } from "@azure/connectors/generated/MeetingroommapExtensions";

const CONNECTION_URL = process.env.MEETINGROOMMAP_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("MEETINGROOMMAP_CONNECTION_URL is required.");

async function main(): Promise<void> {
    try {
        const categories = await new MeetingroommapClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).getCategoriesAsync();
        console.log("Categories:", JSON.stringify(categories, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}

main().catch(console.error);