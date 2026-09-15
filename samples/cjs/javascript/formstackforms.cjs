// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Formstack Forms Connector SDK Sample - CJS JavaScript. */
const { ConnectorError, ManagedIdentityTokenProvider } = require("@azure/connectors");
const { FormstackformsClient } = require("@azure/connectors/generated/FormstackformsExtensions");
const CONNECTION_URL = process.env.FORMSTACKFORMS_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("FORMSTACKFORMS_CONNECTION_URL is required.");
async function main() {
    try {
        const forms = await new FormstackformsClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).getAvailableForms();
        console.log("Forms:", JSON.stringify(forms, null, 2));
    } catch (error) {
        if (error instanceof ConnectorError) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);