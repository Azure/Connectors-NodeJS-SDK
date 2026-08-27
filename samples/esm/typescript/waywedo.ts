// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Way We Do Connector SDK Sample - ESM TypeScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { WaywedoClient } from "@azure/connectors/generated/WaywedoExtensions";

const CONNECTION_URL = process.env.WAYWEDO_CONNECTION_URL ?? "";
const INSTANCE_ID = process.env.WAYWEDO_INSTANCE_ID ?? "";
if (!CONNECTION_URL || !INSTANCE_ID) throw new Error("WAYWEDO_CONNECTION_URL and WAYWEDO_INSTANCE_ID are required.");

async function main(): Promise<void> {
    try {
        const checklist = await new WaywedoClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).checklistInstancesGetAsync(INSTANCE_ID);
        console.log("Checklist instance:", JSON.stringify(checklist, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}

main().catch(console.error);