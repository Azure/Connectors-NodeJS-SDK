// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Slack Connector SDK Sample - CJS TypeScript
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { SlackClient, ListChannelsResponse } from "@azure/connectors/generated/SlackExtensions";

const CONNECTION_URL = process.env.SLACK_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: SLACK_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new SlackClient(CONNECTION_URL, tokenProvider);

    try {
        const result: ListChannelsResponse = await client.listChannelsAsync();
        console.log(`Channels returned: ${(result.channels ?? []).length}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
