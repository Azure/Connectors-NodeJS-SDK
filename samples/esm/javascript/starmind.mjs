// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Starmind Connector SDK Sample - ESM JavaScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { StarmindClient } from "@azure/connectors/generated/StarmindExtensions";

const CONNECTION_URL = process.env.STARMIND_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("STARMIND_CONNECTION_URL is required.");

async function main() {
    try {
        const questions = await new StarmindClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).findQuestionsAsync(process.env.STARMIND_QUERY);
        console.log("Questions:", JSON.stringify(questions, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}

main().catch(console.error);