// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Teams Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates how to use the Teams connector with ESM imports in TypeScript.
 *
 * Prerequisites:
 *   1. Azure subscription with Teams connection via AI Gateway
 *   2. Connection runtime URL from Azure Portal
 *   3. npm install in this folder
 *
 * Usage:
 *   Set environment variable:
 *     $env:TEAMS_CONNECTION_URL = "https://[region].azure-apihub.net/apim/teams/[connection-id]"
 *
 *   Run with tsx (dev):
 *     npx tsx sampleTeams.ts
 *
 *   Or compile and run:
 *     npm run build
 *     node dist/sampleTeams.js
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/azure-connectors";
import { TeamsClient, GetAllTeamsResponse, GetChannelsForGroupResponse } from "@azure/azure-connectors/generated/TeamsExtensions";

const CONNECTION_URL = process.env.TEAMS_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: TEAMS_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    console.log("Teams Connector SDK — ESM TypeScript Sample");
    console.log("=".repeat(50));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new TeamsClient(CONNECTION_URL, tokenProvider);

    // Example 1: List joined teams
    console.log("\n--- List Joined Teams ---");
    let firstTeamId: string | undefined;
    try {
        const teamsResponse: GetAllTeamsResponse = await client.getAllTeamsAsync();
        const teams = teamsResponse.value ?? [];

        if (teams.length > 0) {
            console.log(`Found ${teams.length} joined teams:`);
            for (const team of teams.slice(0, 5)) {
                const teamRecord = team as Record<string, unknown>;
                console.log(`  - ${teamRecord.displayName ?? "Unknown"} (id: ${teamRecord.id})`);
            }

            firstTeamId = (teams[0] as Record<string, unknown>).id as string;
        } else {
            console.log("No joined teams found.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error: ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: List channels for first team
    let firstChannelId: string | undefined;
    if (firstTeamId) {
        console.log("\n--- List Channels (first team) ---");
        try {
            const channelsResponse: GetChannelsForGroupResponse = await client.getChannelsForGroupAsync(firstTeamId);
            const channels = channelsResponse.value ?? [];

            if (channels.length > 0) {
                console.log(`Found ${channels.length} channels:`);
                for (const channel of channels.slice(0, 5)) {
                    const channelRecord = channel as Record<string, unknown>;
                    console.log(`  - ${channelRecord.displayName ?? "Unknown"} (id: ${channelRecord.id})`);
                }

                firstChannelId = (channels[0] as Record<string, unknown>).id as string;
            } else {
                console.log("No channels found.");
            }
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error: ${error.message}`);
            } else {
                throw error;
            }
        }
    }

    // Example 3: Post a message to a channel
    if (firstTeamId && firstChannelId) {
        console.log("\n--- Post Message to Channel ---");
        try {
            const result = await client.postMessageToConversationAsync(
                {
                    recipient: {
                        groupId: firstTeamId,
                        channelId: firstChannelId,
                    },
                    messageBody: `Hello from the <strong>ESM TypeScript</strong> Teams SDK sample! (${new Date().toISOString()})`,
                },
                "user",
                "channel",
            );
            const posted = result as Record<string, unknown>;
            console.log(`Message posted successfully (id: ${posted.id ?? "unknown"}).`);
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error: ${error.message}`);
            } else {
                throw error;
            }
        }
    }

    // Example 4: Get channel messages
    if (firstTeamId && firstChannelId) {
        console.log("\n--- Get Channel Messages ---");
        try {
            const messagesResponse = await client.getMessagesFromChannelAsync(firstTeamId, firstChannelId) as Record<string, unknown>;
            const messages = (messagesResponse.value ?? []) as Array<Record<string, unknown>>;

            if (messages.length > 0) {
                console.log(`Found ${messages.length} messages:`);
                for (const message of messages.slice(0, 3)) {
                    const body = message.body as Record<string, unknown> | undefined;
                    const content = body?.content as string | undefined;
                    const preview = content
                        ? content.replace(/<[^>]+>/g, "").slice(0, 60)
                        : "No content";
                    console.log(`  - [${message.createdDateTime ?? ""}] ${preview}`);
                }
            } else {
                console.log("No messages found.");
            }
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error: ${error.message}`);
            } else {
                throw error;
            }
        }
    }

    // Example 5: Polling trigger — check for new channel messages
    if (firstTeamId && firstChannelId) {
        console.log("\n--- Trigger: Poll for New Channel Messages ---");
        try {
            const triggerResponse = await client.onNewChannelMessageAsync(firstTeamId, firstChannelId);
            const triggerResult = (triggerResponse ?? {}) as Record<string, unknown>;
            const triggerMessages = (Array.isArray(triggerResult.value) ? triggerResult.value : []) as Array<Record<string, unknown>>;

            if (triggerMessages.length > 0) {
                console.log(`Trigger returned ${triggerMessages.length} new messages:`);
                for (const message of triggerMessages.slice(0, 3)) {
                    const body = message.body as Record<string, unknown> | undefined;
                    const content = body?.content as string | undefined;
                    const preview = content
                        ? content.replace(/<[^>]+>/g, "").slice(0, 60)
                        : "No content";
                    console.log(`  - [${message.createdDateTime ?? ""}] ${preview}`);
                }
            } else {
                console.log("No new messages from trigger poll.");
            }
        } catch (error) {
            if (error instanceof ConnectorException) {
                // 202 or 304 are normal for polling triggers when no new data
                console.log(`Trigger poll response (${error.statusCode}): No new messages available.`);
            } else {
                throw error;
            }
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Sample completed!");
}

main().catch(console.error);
