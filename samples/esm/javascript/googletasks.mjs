// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Google Tasks Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates using the Google Tasks connector with ESM imports in plain JavaScript.
 *
 * Usage:
 *   Set environment variable:
 *     $env:GOOGLETASKS_CONNECTION_URL = "https://[region].azure-apihub.net/apim/googletasks/[connection-id]"
 *
 *   Run:
 *     node googletasks.mjs
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { GoogletasksClient } from "@azure/connectors/generated/GoogletasksExtensions";

const CONNECTION_URL = process.env.GOOGLETASKS_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: GOOGLETASKS_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new GoogletasksClient(CONNECTION_URL, tokenProvider);

    // Example: List the task lists, then the tasks in the first one.
    try {
        const taskLists = await client.listTaskListsAsync();
        console.log("Task lists:", JSON.stringify(taskLists, null, 2));

        const taskListId = process.env.GOOGLETASKS_TASK_LIST_ID;
        if (taskListId) {
            const tasks = await client.listTasksAsync(taskListId);
            console.log("Tasks:", JSON.stringify(tasks, null, 2));
        } else {
            console.log("Set GOOGLETASKS_TASK_LIST_ID to list tasks in a specific list.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
