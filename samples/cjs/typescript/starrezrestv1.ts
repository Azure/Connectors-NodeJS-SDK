// Copyright (c) Microsoft Corporation.  All rights reserved.

/** StarRez REST V1 Connector SDK Sample - CJS TypeScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { Starrezrestv1Client } from "@azure/connectors/generated/Starrezrestv1Extensions";
const CONNECTION_URL = process.env.STARREZRESTV1_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("STARREZRESTV1_CONNECTION_URL is required.");
async function main(): Promise<void> {
    try {
        const entries = await new Starrezrestv1Client(CONNECTION_URL, new ManagedIdentityTokenProvider()).selectEntryAsync({ _pageSize: 10, _pageIndex: 0 });
        console.log("Entries:", JSON.stringify(entries, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);