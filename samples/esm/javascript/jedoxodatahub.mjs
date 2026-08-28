// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Jedox OData Hub Connector SDK Sample - ESM JavaScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { JedoxodatahubClient } from "@azure/connectors/generated/JedoxodatahubExtensions";

const CONNECTION_URL = process.env.JEDOXODATAHUB_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("JEDOXODATAHUB_CONNECTION_URL is required.");

async function main() {
    try {
        const databases = await new JedoxodatahubClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).databasesAsync("10");
        console.log("Databases:", JSON.stringify(databases, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}

main().catch(console.error);