// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Zoho ZeptoMail Connector SDK Sample - CJS TypeScript. */
import { ConnectorException, ManagedIdentityTokenProvider } from "@azure/connectors";
import { ZeptomailClient } from "@azure/connectors/generated/ZeptomailExtensions";
const CONNECTION_URL = process.env.ZEPTOMAIL_CONNECTION_URL ?? "";
const MAIL_AGENT_KEY = process.env.ZEPTOMAIL_MAIL_AGENT_KEY ?? "";
if (!CONNECTION_URL || !MAIL_AGENT_KEY) throw new Error("ZEPTOMAIL_CONNECTION_URL and ZEPTOMAIL_MAIL_AGENT_KEY are required.");
async function main(): Promise<void> {
    try {
        const emails = await new ZeptomailClient(CONNECTION_URL, new ManagedIdentityTokenProvider())
            .getProcessedEmailsAsync(MAIL_AGENT_KEY);
        console.log("Processed emails:", JSON.stringify(emails, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) console.error(`Connector error (${error.statusCode}): ${error.message}`);
        else throw error;
    }
}
main().catch(console.error);
