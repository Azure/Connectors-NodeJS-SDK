// Copyright (c) Microsoft Corporation.  All rights reserved.

/** WordPress Connector SDK Sample - ESM TypeScript. */
import { ConnectorError, ManagedIdentityTokenProvider } from "@azure/connectors";
import { WordPressClient } from "@azure/connectors/generated/WordPressExtensions";

const CONNECTION_URL = process.env.WORDPRESS_CONNECTION_URL ?? "";
const SITE_ID = process.env.WORDPRESS_SITE_ID ?? "";
if (!CONNECTION_URL || !SITE_ID) throw new Error("WORDPRESS_CONNECTION_URL and WORDPRESS_SITE_ID are required.");

async function main(): Promise<void> {
    try {
        const statistics = await new WordPressClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).siteStats(SITE_ID);
        console.log("Site statistics:", JSON.stringify(statistics, null, 2));
    } catch (error) {
        if (error instanceof ConnectorError) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}

main().catch(console.error);