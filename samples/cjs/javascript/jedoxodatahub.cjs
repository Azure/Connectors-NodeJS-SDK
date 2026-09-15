// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Jedox OData Hub Connector SDK Sample - CJS JavaScript. */
const { ConnectorError, ManagedIdentityTokenProvider } = require("@azure/connectors");
const { JedoxodatahubClient } = require("@azure/connectors/generated/JedoxodatahubExtensions");
const CONNECTION_URL = process.env.JEDOXODATAHUB_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("JEDOXODATAHUB_CONNECTION_URL is required.");
async function main() {
    try {
        const databases = await new JedoxodatahubClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).databases("10");
        console.log("Databases:", JSON.stringify(databases, null, 2));
    } catch (error) {
        if (error instanceof ConnectorError) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);