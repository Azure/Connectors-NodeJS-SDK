// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Rev.ai Connector SDK Sample - ESM JavaScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { RevaiClient } from "@azure/connectors/generated/RevaiExtensions";

const CONNECTION_URL = process.env.REVAI_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("REVAI_CONNECTION_URL is required.");

async function main() {
    try {
        const transcriptions = await new RevaiClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).transcriptionsGetAsync("10");
        console.log("Transcriptions:", JSON.stringify(transcriptions, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}

main().catch(console.error);