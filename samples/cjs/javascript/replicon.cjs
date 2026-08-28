// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Replicon Connector SDK Sample - CJS JavaScript. */
const { ConnectorException, ManagedIdentityTokenProvider } = require("@azure/connectors");
const { RepliconClient } = require("@azure/connectors/generated/RepliconExtensions");
const CONNECTION_URL = process.env.REPLICON_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("REPLICON_CONNECTION_URL is required.");
async function main() {
    try {
        const tenant = await new RepliconClient(CONNECTION_URL, new ManagedIdentityTokenProvider()).getMyTenantEndpointDetailsAsync();
        console.log("Tenant:", JSON.stringify(tenant, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);