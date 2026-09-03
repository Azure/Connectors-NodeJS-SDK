// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Teams Connector SDK Sample — CJS JavaScript
 *
 * Demonstrates how to use the Teams connector with CommonJS require() in plain JavaScript.
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
 *   Run:
 *     npm start
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { TeamsClient } = require("@azure/connectors/generated/TeamsExtensions");

const CONNECTION_URL = process.env.TEAMS_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: TEAMS_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    console.log("Teams Connector SDK — CJS JavaScript Sample");
    console.log("=".repeat(50));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new TeamsClient(CONNECTION_URL, tokenProvider);

    // Example 1: List joined teams
    console.log("\n--- List Joined Teams ---");
    let firstTeamId;
    try {
        const teamsResponse = await client.getAllTeamsAsync();
        const teams = teamsResponse.value ?? [];

        if (teams.length > 0) {
            console.log(`Found ${teams.length} joined teams:`);
            for (const team of teams.slice(0, 5)) {
                console.log(`  - ${team.displayName ?? "Unknown"} (id: ${team.id})`);
            }

            firstTeamId = teams[0].id;
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
    let firstChannelId;
    if (firstTeamId) {
        console.log("\n--- List Channels (first team) ---");
        try {
            const channelsResponse = await client.getChannelsForGroupAsync(firstTeamId);
            const channels = channelsResponse.value ?? [];

            if (channels.length > 0) {
                console.log(`Found ${channels.length} channels:`);
                for (const channel of channels.slice(0, 5)) {
                    console.log(`  - ${channel.displayName ?? "Unknown"} (id: ${channel.id})`);
                }

                firstChannelId = channels[0].id;
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
                    messageBody: `Hello from the <strong>CJS JavaScript</strong> Teams SDK sample! (${new Date().toISOString()})`,
                },
                "user",
                "channel",
            );
            console.log(`Message posted successfully (id: ${result.id ?? "unknown"}).`);
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
            const messages = [];
            for await (const message of client.getMessagesFromChannelAsync(firstTeamId, firstChannelId)) {
                messages.push(message);
            }

            if (messages.length > 0) {
                console.log(`Found ${messages.length} messages:`);
                for (const message of messages.slice(0, 3)) {
                    const body = message.body;
                    const content = body?.content;
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

    // Example 5: Poll for channel updates by re-reading recent messages
    if (firstTeamId && firstChannelId) {
        console.log("\n--- Poll Channel Messages ---");
        try {
            const polledMessages = [];
            for await (const message of client.getMessagesFromChannelAsync(firstTeamId, firstChannelId)) {
                polledMessages.push(message);
            }

            if (polledMessages.length > 0) {
                console.log(`Poll returned ${polledMessages.length} messages:`);
                for (const message of polledMessages.slice(0, 3)) {
                    const body = message.body;
                    const content = body?.content;
                    const preview = content
                        ? content.replace(/<[^>]+>/g, "").slice(0, 60)
                        : "No content";
                    console.log(`  - [${message.createdDateTime ?? ""}] ${preview}`);
                }
            } else {
                console.log("No messages returned from poll.");
            }
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Polling response (${error.statusCode}): No messages available.`);
            } else {
                throw error;
            }
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Sample completed!");
}

main().catch(console.error);
