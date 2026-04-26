// Copyright (c) Microsoft Corporation. All rights reserved.

/**
 * Microsoft Teams Connector SDK Sample
 *
 * This sample demonstrates how to use the Teams connector SDK for TypeScript.
 *
 * Prerequisites:
 * 1. Azure subscription with Teams connection
 * 2. Teams connection in Azure Logic Apps
 * 3. Connection runtime URL from Azure Portal
 *
 * Installation:
 *     npm install @azure/azure-connectors
 *
 * Usage:
 *     Set environment variable:
 *     $env:TEAMS_CONNECTION_URL = "https://[region].azure-apihub.net/apim/teams/[connection-id]"
 *
 *     npx ts-node sample_connector_usage_teams.ts
 */

import { DefaultAzureCredential } from "@azure/identity";
import {
    TeamsClient,
    TeamsConnectorError,
} from "@azure/azure-connectors/generated/TeamsExtensions";

// Connection runtime URL format:
// https://[region].azure-apihub.net/apim/teams/[connection-id]
const CONNECTION_RUNTIME_URL = process.env.TEAMS_CONNECTION_URL ?? "";

function createClient(): TeamsClient {
    const credential = new DefaultAzureCredential();

    return new TeamsClient({
        connectionRuntimeUrl: CONNECTION_RUNTIME_URL,
        getToken: async () => {
            const token = await credential.getToken("https://logic-apis-westus.azure-apihub.net/.default");
            return token.token;
        },
    });
}

async function example1ListJoinedTeams(): Promise<void> {
    console.log("\n=== Example 1: List Joined Teams ===");

    const client = createClient();

    try {
        const teams = await client.getAllTeamsAsync();

        const teamList = teams?.value ?? [];
        console.log(`Found ${teamList.length} teams`);
        for (const team of teamList.slice(0, 3)) {
            console.log(`  - ${team.displayName ?? "Unknown"} (${team.id ?? "Unknown"})`);
        }
    } catch (error) {
        if (error instanceof TeamsConnectorError) {
            console.log(`Connector error: ${error.message}`);
        } else {
            console.log(`Error: ${error}`);
        }
    }
}

async function example2ListAssociatedTeams(): Promise<void> {
    console.log("\n=== Example 2: List Associated Teams ===");

    const client = createClient();

    try {
        const teams = await client.getAllAssociatedTeamsAsync();

        const teamList = teams?.value ?? [];
        console.log(`Found ${teamList.length} associated teams`);
        for (const team of teamList.slice(0, 3)) {
            console.log(`  - ${team.displayName ?? "Unknown"}`);
        }
    } catch (error) {
        if (error instanceof TeamsConnectorError) {
            console.log(`Connector error: ${error.message}`);
        } else {
            console.log(`Error: ${error}`);
        }
    }
}

async function example3ListChannels(): Promise<void> {
    console.log("\n=== Example 3: List Channels for a Team ===");

    const teamId = process.env.TEST_TEAM_ID ?? "";
    if (!teamId) {
        console.log("Skipped: Set TEST_TEAM_ID environment variable to run this example.");
        return;
    }

    const client = createClient();

    try {
        const channels = await client.getChannelsForGroupAsync(teamId);

        const channelList = channels?.value ?? [];
        console.log(`Found ${channelList.length} channels:`);
        for (const channel of channelList) {
            console.log(`  - ${channel.displayName ?? "Unknown"} (${channel.membershipType ?? "standard"})`);
            if (channel.description) {
                console.log(`    Description: ${channel.description}`);
            }
        }
    } catch (error) {
        if (error instanceof TeamsConnectorError) {
            console.log(`Connector error: ${error.message}`);
        } else {
            console.log(`Error: ${error}`);
        }
    }
}

async function example4GetTeamDetails(): Promise<void> {
    console.log("\n=== Example 4: Get Team Details ===");

    const teamId = process.env.TEST_TEAM_ID ?? "";
    if (!teamId) {
        console.log("Skipped: Set TEST_TEAM_ID environment variable to run this example.");
        return;
    }

    const client = createClient();

    try {
        const team = await client.getTeamAsync(teamId) as Record<string, unknown>;

        console.log(`Team: ${team.displayName ?? "Unknown"}`);
        console.log(`  ID: ${team.id ?? "Unknown"}`);
        console.log(`  Description: ${team.description ?? "None"}`);
        console.log(`  Archived: ${team.isArchived ?? false}`);
        console.log(`  Web URL: ${team.webUrl ?? "N/A"}`);
    } catch (error) {
        if (error instanceof TeamsConnectorError) {
            console.log(`Connector error: ${error.message}`);
        } else {
            console.log(`Error: ${error}`);
        }
    }
}

async function example5GetChannelMessages(): Promise<void> {
    console.log("\n=== Example 5: Get Messages in a Channel ===");

    const teamId = process.env.TEST_TEAM_ID ?? "";
    const channelId = process.env.TEST_CHANNEL_ID ?? "";
    if (!teamId || !channelId) {
        console.log("Skipped: Set TEST_TEAM_ID and TEST_CHANNEL_ID environment variables to run this example.");
        return;
    }

    const client = createClient();

    try {
        const messagesResponse = await client.getMessagesFromChannelAsync(teamId, channelId) as Record<string, unknown>;

        const messageList = (messagesResponse?.value ?? []) as Array<Record<string, unknown>>;
        console.log(`Found ${messageList.length} messages:`);
        for (const message of messageList.slice(0, 5)) {
            const body = message.body as Record<string, unknown> | undefined;
            const from = message.from as Record<string, unknown> | undefined;
            const user = from?.user as Record<string, unknown> | undefined;
            console.log(`  - [${message.id ?? "?"}] by ${user?.displayName ?? "Unknown"}`);
            console.log(`    Content: ${(body?.content as string)?.substring(0, 80) ?? "N/A"}`);
        }
    } catch (error) {
        if (error instanceof TeamsConnectorError) {
            console.log(`Connector error: ${error.message}`);
        } else {
            console.log(`Error: ${error}`);
        }
    }
}

async function example6ErrorHandling(): Promise<void> {
    console.log("\n=== Example 6: Error Handling ===");

    const client = createClient();

    try {
        const invalidTeamId = "00000000-0000-0000-0000-000000000000";
        const team = await client.getTeamAsync(invalidTeamId);
        console.log(`Unexpected success: ${JSON.stringify(team)}`);
    } catch (error) {
        if (error instanceof TeamsConnectorError) {
            console.log("Expected error caught:");
            console.log(`  Message: ${error.message}`);
        } else {
            console.log(`Unexpected error type: ${(error as Error).constructor.name}`);
            console.log(`  Message: ${error}`);
        }
    }
}

async function main(): Promise<void> {
    console.log("Teams Connector SDK - Sample Usage");
    console.log("=".repeat(50));

    await example1ListJoinedTeams();
    await example2ListAssociatedTeams();
    await example3ListChannels();
    await example4GetTeamDetails();
    await example5GetChannelMessages();
    await example6ErrorHandling();

    console.log("\n" + "=".repeat(50));
    console.log("Sample completed!");
}

main().catch(console.error);
