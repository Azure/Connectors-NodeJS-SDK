// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Docusign Connector SDK Sample - ESM JavaScript
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { DocusignClient } from "@azure/connectors/generated/DocusignExtensions";

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
        const result = await client.resendEnvelopeAsync(DOCUSIGN_ENVELOPE_ID);
        console.log(`Resend result keys: ${Object.keys(result).join(", ")}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
