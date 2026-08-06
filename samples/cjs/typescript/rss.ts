// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * RSS Connector SDK Sample — CJS TypeScript
 *
 * Demonstrates using the RSS connector with CommonJS module output in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:RSS_CONNECTION_URL = "https://[region].azure-apihub.net/apim/rss/[connection-id]"
 *     $env:RSS_FEED_URL       = "[optional feed url]"
 *
 *   Run with tsx (dev):
 *     npx tsx rss.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { RssClient } from "@azure/connectors/generated/RssExtensions";

const CONNECTION_URL = process.env.RSS_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: RSS_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new RssClient(CONNECTION_URL, tokenProvider);

    const feedUrl = process.env.RSS_FEED_URL ?? "https://azure.microsoft.com/updates/feed/";

    // Example: List the items in an RSS feed.
    try {
        const items = await client.listFeedItemsAsync(feedUrl);
        console.log(`Found ${items.length} feed item(s) from ${feedUrl}.`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
