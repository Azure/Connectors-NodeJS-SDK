// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Microsoft To Do Connector SDK Sample - ESM JavaScript
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { TodoClient } from "@azure/connectors/generated/TodoExtensions";

const CONNECTION_URL = process.env.TODO_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: TODO_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new TodoClient(CONNECTION_URL, tokenProvider);

    try {
        const result = await client.getAllTodoListsAsync();
        console.log(`To-do lists found: ${result.length}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
