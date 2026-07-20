// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * GitHub Connector SDK Sample - CJS TypeScript
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { GithubClient, RepositoryDetails } from "@azure/connectors/generated/GithubExtensions";

const CONNECTION_URL = process.env.GITHUB_CONNECTION_URL ?? "";
const GITHUB_REPOSITORY_ID = process.env.GITHUB_REPOSITORY_ID ?? "1";

if (!CONNECTION_URL) {
    console.error("Error: GITHUB_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new GithubClient(CONNECTION_URL, tokenProvider);

    try {
        const result: RepositoryDetails = await client.getRepositoryByIdAsync(GITHUB_REPOSITORY_ID);
        console.log(`Repository id: ${String(result.id ?? "unknown")}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
