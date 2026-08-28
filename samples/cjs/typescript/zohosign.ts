// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Zoho Sign Connector SDK Sample - CJS TypeScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { ZohosignClient } from "@azure/connectors/generated/ZohosignExtensions";
const CONNECTION_URL = process.env.ZOHOSIGN_CONNECTION_URL ?? "";
const REQUEST_ID = process.env.ZOHOSIGN_REQUEST_ID ?? "";
if (!CONNECTION_URL || !REQUEST_ID) throw new Error("ZOHOSIGN_CONNECTION_URL and ZOHOSIGN_REQUEST_ID are required.");
async function main(): Promise<void> {
    try {
        const certificate = await new ZohosignClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).downloadCompletionCertificateAsync(REQUEST_ID);
        console.log("Certificate size:", certificate.size);
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);