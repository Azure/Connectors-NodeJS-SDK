// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Jira Connector SDK Sample - ESM JavaScript
 */

import { ManagedIdentityTokenProvider, ConnectorError } from "@azure/connectors";
import { JiraClient } from "@azure/connectors/generated/JiraExtensions";

const CONNECTION_URL = process.env.JIRA_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: JIRA_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new JiraClient(CONNECTION_URL, tokenProvider);

    try {
        let resourceCount = 0;
        for await (const _resource of client.listResources()) {
            resourceCount++;
        }

        console.log(`Resources found: ${resourceCount}`);
    } catch (error) {
        if (error instanceof ConnectorError) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
