// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Tallyfy Connector SDK Sample - ESM JavaScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { TallyfyClient } from "@azure/connectors/generated/TallyfyExtensions";

const CONNECTION_URL = process.env.TALLYFY_CONNECTION_URL ?? "";
const ORGANIZATION = process.env.TALLYFY_ORGANIZATION ?? "";
const USER_ID = process.env.TALLYFY_USER_ID ?? "";
if (!CONNECTION_URL || !ORGANIZATION || !USER_ID) throw new Error("TALLYFY_CONNECTION_URL, TALLYFY_ORGANIZATION, and TALLYFY_USER_ID are required.");

async function main() {
    try {
        const tasks = await new TallyfyClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).getUserTasksAsync(ORGANIZATION, USER_ID);
        console.log("Tasks:", JSON.stringify(tasks, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}

main().catch(console.error);