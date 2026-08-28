// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Seismic Planner Connector SDK Sample - CJS TypeScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { SeismicplannerClient } from "@azure/connectors/generated/SeismicplannerExtensions";
const CONNECTION_URL = process.env.SEISMICPLANNER_CONNECTION_URL ?? "";
const SPACE_ID = process.env.SEISMICPLANNER_SPACE_ID ?? "";
const NODE_ID = process.env.SEISMICPLANNER_NODE_ID ?? "";
if (!CONNECTION_URL || !SPACE_ID || !NODE_ID) throw new Error("SEISMICPLANNER_CONNECTION_URL, SEISMICPLANNER_SPACE_ID, and SEISMICPLANNER_NODE_ID are required.");
async function main(): Promise<void> {
    try {
        const comments = await new SeismicplannerClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).getCommentsAsync(SPACE_ID, NODE_ID);
        console.log("Comments:", JSON.stringify(comments, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);