// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Jira Connector SDK Sample - ESM TypeScript
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { JiraClient } from "@azure/connectors/generated/JiraExtensions";

const CONNECTION_URL = process.env.JIRA_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: JIRA_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new JiraClient(CONNECTION_URL, tokenProvider);

    try {
        const result: Array<Record<string, unknown>> = await client.listResourcesAsync();
        console.log(`Resources found: ${result.length}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
