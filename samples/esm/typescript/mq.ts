// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * IBM MQ Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates how to use the IBM MQ connector with ESM imports in TypeScript.
 *
 * Prerequisites:
 *   1. Azure subscription with IBM MQ connection via AI Gateway
 *   2. Connection runtime URL from Azure Portal
 *   3. IBM MQ queue name
 *   4. npm install in this folder
 *
 * Usage:
 *   Set environment variables:
 *     $env:MQ_CONNECTION_URL = "https://[region].azure-apihub.net/apim/mq/[connection-id]"
 *     $env:MQ_QUEUE_NAME = "DEV.QUEUE.1"
 *
 *   Run with tsx (dev):
 *     npx tsx mq.ts
 *
 *   Or compile and run:
 *     npm run build
 *     node dist/mq.js
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { MqClient, Item, SendResponse, SingleGetValidOptions, MultipleGetValidOptions } from "@azure/connectors/generated/MqExtensions";

const CONNECTION_URL = process.env.MQ_CONNECTION_URL ?? "";
const QUEUE_NAME = process.env.MQ_QUEUE_NAME ?? "DEV.QUEUE.1";

if (!CONNECTION_URL) {
    console.error("Error: MQ_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    console.log("IBM MQ Connector SDK — ESM TypeScript Sample");
    console.log("=".repeat(50));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new MqClient(CONNECTION_URL, tokenProvider);

    // Example 1: Send a message to a queue
    console.log("\n--- Send Message ---");
    let sentMessageId: string | undefined;
    try {
        const sendResult: SendResponse = await client.sendAsync({
            Queue: QUEUE_NAME,
            MessageData: `Hello from SDK sample! (${new Date().toISOString()})`,
        });
        const record = sendResult as Record<string, unknown>;
        sentMessageId = record.MessageId as string;
        console.log(`Message sent successfully.`);
        console.log(`  MessageId: ${sentMessageId ?? "unknown"}`);
        console.log(`  CorrelationId: ${record.CorrelationId ?? "none"}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: Read (peek) a message without removing it
    console.log("\n--- Read (Peek) Message ---");
    try {
        const readOptions: SingleGetValidOptions = {
            Queue: QUEUE_NAME,
            Timeout: 5,
        };
        const message: Item = await client.readAsync(readOptions);
        const messageRecord = message as Record<string, unknown>;
        console.log(`Message read successfully:`);
        console.log(`  MessageId: ${messageRecord.MessageId ?? "unknown"}`);
        console.log(`  Data: ${messageRecord.MessageData ?? "empty"}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 3: Receive (destructive read) messages
    console.log("\n--- Receive Messages ---");
    try {
        const receiveOptions: MultipleGetValidOptions = {
            Queue: QUEUE_NAME,
            MaxCount: 5,
            Timeout: 5,
        };
        const messages = await client.receiveAllAsync(receiveOptions);
        const messageList = (messages as Record<string, unknown>).value as Array<Record<string, unknown>> ?? [];
        console.log(`Received ${messageList.length} messages:`);
        for (const msg of messageList.slice(0, 5)) {
            console.log(`  - [${msg.MessageId}] ${msg.MessageData ?? "empty"}`);
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Sample completed!");
}

main().catch(console.error);
