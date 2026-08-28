// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Etsy Connector SDK Sample - ESM JavaScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { EtsyClient } from "@azure/connectors/generated/EtsyExtensions";

const CONNECTION_URL = process.env.ETSY_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("ETSY_CONNECTION_URL is required.");

async function main() {
    try {
        const response = await new EtsyClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).pingAsync();
        console.log("Ping response:", JSON.stringify(response, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}

main().catch(console.error);