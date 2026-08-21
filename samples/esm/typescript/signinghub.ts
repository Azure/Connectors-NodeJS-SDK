// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * SigningHub Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates using the SigningHub connector with ESM imports in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:SIGNINGHUB_CONNECTION_URL  = "https://[region].azure-apihub.net/apim/signinghub/[connection-id]"
 *     $env:SIGNINGHUB_PACKAGE_ID      = "[required numeric package id]"
 *     $env:SIGNINGHUB_DOCUMENT_ID     = "[required numeric document id]"
 *     $env:SIGNINGHUB_ATTACHMENT_ID   = "[required numeric attachment id]"
 *
 *   Run with tsx (dev):
 *     npx tsx signinghub.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { SigninghubClient } from "@azure/connectors/generated/SigninghubExtensions";

const CONNECTION_URL = process.env.SIGNINGHUB_CONNECTION_URL ?? "";
const PACKAGE_ID = process.env.SIGNINGHUB_PACKAGE_ID ?? "";
const DOCUMENT_ID = process.env.SIGNINGHUB_DOCUMENT_ID ?? "";
const ATTACHMENT_ID = process.env.SIGNINGHUB_ATTACHMENT_ID ?? "";

if (!CONNECTION_URL) {
    console.error("Error: SIGNINGHUB_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

if (!/^\d+$/.test(PACKAGE_ID)) {
    console.error("Error: SIGNINGHUB_PACKAGE_ID environment variable must be set to a numeric value.");
    process.exit(1);
}

if (!/^\d+$/.test(DOCUMENT_ID)) {
    console.error("Error: SIGNINGHUB_DOCUMENT_ID environment variable must be set to a numeric value.");
    process.exit(1);
}

if (!/^\d+$/.test(ATTACHMENT_ID)) {
    console.error("Error: SIGNINGHUB_ATTACHMENT_ID environment variable must be set to a numeric value.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new SigninghubClient(CONNECTION_URL, tokenProvider);

    // Example 1: Download a document attachment.
    try {
        const attachment = await client.attachmentDownloadAttachmentAsync(PACKAGE_ID, DOCUMENT_ID, ATTACHMENT_ID);
        console.log("Attachment:", JSON.stringify(attachment, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
