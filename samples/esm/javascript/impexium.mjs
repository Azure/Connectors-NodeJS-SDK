// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Impexium Connector SDK Sample - ESM JavaScript. */
import { ConnectorError, ManagedIdentityTokenProvider } from "@azure/connectors";
import { ImpexiumClient } from "@azure/connectors/generated/ImpexiumExtensions";

const CONNECTION_URL = process.env.IMPEXIUM_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("IMPEXIUM_CONNECTION_URL is required.");

async function main() {
    try {
        const checkouts = await new ImpexiumClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).getAbandonedCheckouts(
            "1",
            process.env.IMPEXIUM_ABANDONED_FROM ?? "",
            "application/json",
        );
        console.log("Abandoned checkouts:", JSON.stringify(checkouts, null, 2));
    } catch (error) {
        if (error instanceof ConnectorError) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}

main().catch(console.error);