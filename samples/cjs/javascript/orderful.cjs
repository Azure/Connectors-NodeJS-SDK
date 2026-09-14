// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Orderful Connector SDK Sample - CJS JavaScript. */
const { ConnectorError, ManagedIdentityTokenProvider } = require("@azure/connectors");
const { OrderfulClient } = require("@azure/connectors/generated/OrderfulExtensions");
const CONNECTION_URL = process.env.ORDERFUL_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("ORDERFUL_CONNECTION_URL is required.");
async function main() {
    try {
        await new OrderfulClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).listTransactions();
        console.log("Transactions listed successfully.");
    } catch (error) {
        if (error instanceof ConnectorError) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);