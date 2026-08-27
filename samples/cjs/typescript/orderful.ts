// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Orderful Connector SDK Sample - CJS TypeScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { OrderfulClient } from "@azure/connectors/generated/OrderfulExtensions";
const CONNECTION_URL = process.env.ORDERFUL_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("ORDERFUL_CONNECTION_URL is required.");
async function main(): Promise<void> {
    try {
        await new OrderfulClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).listTransactionsAsync();
        console.log("Transactions listed successfully.");
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);