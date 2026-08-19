// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Microsoft Forms Connector SDK Sample - CJS JavaScript
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { MicrosoftformsClient } = require("@azure/connectors/generated/MicrosoftformsExtensions");

const CONNECTION_URL = process.env.MICROSOFTFORMS_CONNECTION_URL ?? "";
const MICROSOFTFORMS_FORM_ID = process.env.MICROSOFTFORMS_FORM_ID ?? "replace-with-form-id";

if (!CONNECTION_URL) {
    console.error("Error: MICROSOFTFORMS_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new MicrosoftformsClient(CONNECTION_URL, tokenProvider);

    try {
        const result = await client.getFormDetailsByIdAsync(MICROSOFTFORMS_FORM_ID, "id,title");
        console.log(`Form details keys: ${Object.keys(result).join(", ")}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
