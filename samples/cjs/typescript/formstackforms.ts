// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Formstack Forms Connector SDK Sample - CJS TypeScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { FormstackformsClient } from "@azure/connectors/generated/FormstackformsExtensions";
const CONNECTION_URL = process.env.FORMSTACKFORMS_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("FORMSTACKFORMS_CONNECTION_URL is required.");
async function main(): Promise<void> {
    try {
        const forms = await new FormstackformsClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).getAvailableFormsAsync();
        console.log("Forms:", JSON.stringify(forms, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);