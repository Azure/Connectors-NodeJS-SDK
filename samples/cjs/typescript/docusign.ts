// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Docusign Connector SDK Sample - CJS TypeScript
 */

import { ManagedIdentityTokenProvider, ConnectorError } from "@azure/connectors";
import { DocuSignClient, EnvelopeResendResponse } from "@azure/connectors/generated/DocuSignExtensions";

const CONNECTION_URL = process.env.DOCUSIGN_CONNECTION_URL ?? "";
const DOCUSIGN_ENVELOPE_ID = process.env.DOCUSIGN_ENVELOPE_ID ?? "replace-with-envelope-id";

if (!CONNECTION_URL) {
    console.error("Error: DOCUSIGN_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new DocuSignClient(CONNECTION_URL, tokenProvider);

    try {
        const result: EnvelopeResendResponse = await client.resendEnvelope(DOCUSIGN_ENVELOPE_ID);
        console.log(`Resend result keys: ${Object.keys(result as Record<string, unknown>).join(", ")}`);
    } catch (error) {
        if (error instanceof ConnectorError) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
