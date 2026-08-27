// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Twitter Connector SDK Sample - ESM TypeScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { TwitterClient } from "@azure/connectors/generated/TwitterExtensions";

const CONNECTION_URL = process.env.TWITTER_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("TWITTER_CONNECTION_URL is required.");

async function main(): Promise<void> {
    try {
        const tweets = await new TwitterClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).homeTimelineAsync("10");
        console.log("Tweets:", JSON.stringify(tweets, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}

main().catch(console.error);