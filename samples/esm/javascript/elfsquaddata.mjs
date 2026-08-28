// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Elfsquad Data Connector SDK Sample - ESM JavaScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { ElfsquaddataClient } from "@azure/connectors/generated/ElfsquaddataExtensions";

const CONNECTION_URL = process.env.ELFSQUADDATA_CONNECTION_URL ?? "";
const ENTITY_NAME = process.env.ELFSQUADDATA_ENTITY_NAME ?? "";
if (!CONNECTION_URL || !ENTITY_NAME) throw new Error("ELFSQUADDATA_CONNECTION_URL and ELFSQUADDATA_ENTITY_NAME are required.");

async function main() {
    try {
        const entities = await new ElfsquaddataClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).getEntitiesAsync(ENTITY_NAME);
        console.log("Entities:", JSON.stringify(entities, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}

main().catch(console.error);