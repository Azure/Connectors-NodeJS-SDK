// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Impexium Connector SDK Sample - CJS TypeScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { ImpexiumClient } from "@azure/connectors/generated/ImpexiumExtensions";
const CONNECTION_URL = process.env.IMPEXIUM_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("IMPEXIUM_CONNECTION_URL is required.");
async function main(): Promise<void> {
    try {
        const checkouts = await new ImpexiumClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).getAbandonedCheckoutsAsync("1");
        console.log("Abandoned checkouts:", JSON.stringify(checkouts, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);