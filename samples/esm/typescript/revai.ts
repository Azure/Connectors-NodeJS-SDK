// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Rev.ai Connector SDK Sample - ESM TypeScript. */
import { ConnectorError, ManagedIdentityTokenProvider } from "@azure/connectors";
import { RevAIClient } from "@azure/connectors/generated/RevAIExtensions";

const CONNECTION_URL = process.env.REVAI_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("REVAI_CONNECTION_URL is required.");

async function main(): Promise<void> {
    try {
        const transcriptions = await new RevAIClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).getTranscriptions({ limit: 10 });
        console.log("Transcriptions:", JSON.stringify(transcriptions, null, 2));
    } catch (error) {
        if (error instanceof ConnectorError) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}

main().catch(console.error);