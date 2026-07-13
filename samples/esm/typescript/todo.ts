// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Microsoft To Do Connector SDK Sample - ESM TypeScript
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { TodoClient, TodoList } from "@azure/connectors/generated/TodoExtensions";

const CONNECTION_URL = process.env.TODO_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: TODO_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new TodoClient(CONNECTION_URL, tokenProvider);

    try {
        const result: Array<TodoList> = await client.getAllTodoListsAsync();
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
