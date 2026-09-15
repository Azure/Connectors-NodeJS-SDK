// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Docusign Connector SDK Sample - CJS JavaScript
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorError } = require("@azure/connectors");
const { DocusignClient } = require("@azure/connectors/generated/DocusignExtensions");

const CONNECTION_URL = process.env.DOCUSIGN_CONNECTION_URL ?? "";
const DOCUSIGN_ENVELOPE_ID = process.env.DOCUSIGN_ENVELOPE_ID ?? "replace-with-envelope-id";

if (!CONNECTION_URL) {
    console.error("Error: DOCUSIGN_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new DocusignClient(CONNECTION_URL, tokenProvider);

    try {
        const result = await client.resendEnvelope(DOCUSIGN_ENVELOPE_ID);
        console.log(`Resend result keys: ${Object.keys(result).join(", ")}`);
    } catch (error) {
        if (error instanceof ConnectorError) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
