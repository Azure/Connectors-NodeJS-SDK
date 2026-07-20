// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Microsoft Forms Connector SDK Sample - ESM TypeScript
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { MicrosoftformsClient, GetFormDetailsByIdResult } from "@azure/connectors/generated/MicrosoftformsExtensions";

const CONNECTION_URL = process.env.MICROSOFTFORMS_CONNECTION_URL ?? "";
const MICROSOFTFORMS_FORM_ID = process.env.MICROSOFTFORMS_FORM_ID ?? "replace-with-form-id";

if (!CONNECTION_URL) {
    console.error("Error: MICROSOFTFORMS_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new MicrosoftformsClient(CONNECTION_URL, tokenProvider);

    try {
        const result: GetFormDetailsByIdResult = await client.getFormDetailsByIdAsync(MICROSOFTFORMS_FORM_ID, "id,title");
        console.log(`Form details keys: ${Object.keys(result as Record<string, unknown>).join(", ")}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
