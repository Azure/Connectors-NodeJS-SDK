// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Plivo Connector SDK Sample - CJS JavaScript. */
const { ConnectorException, ManagedIdentityTokenProvider } = require("@azure/connectors");
const { PlivoClient } = require("@azure/connectors/generated/PlivoExtensions");
const CONNECTION_URL = process.env.PLIVO_CONNECTION_URL ?? "";
const AUTH_ID = process.env.PLIVO_AUTH_ID ?? "";
if (!CONNECTION_URL || !AUTH_ID) throw new Error("PLIVO_CONNECTION_URL and PLIVO_AUTH_ID are required.");
async function main() {
    try {
        const messages = await new PlivoClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).listMessagesAsync(AUTH_ID);
        console.log("Messages:", JSON.stringify(messages, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);