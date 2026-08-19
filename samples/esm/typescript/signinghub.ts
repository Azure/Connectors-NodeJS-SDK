// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * SigningHub Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates using the SigningHub connector with ESM imports in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:SIGNINGHUB_CONNECTION_URL  = "https://[region].azure-apihub.net/apim/signinghub/[connection-id]"
 *     $env:SIGNINGHUB_PACKAGE_ID      = "[optional package id]"
 *     $env:SIGNINGHUB_DOCUMENT_ID     = "[optional document id]"
 *     $env:SIGNINGHUB_ATTACHMENT_ID   = "[optional attachment id]"
 *
 *   Run with tsx (dev):
 *     npx tsx signinghub.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { SigninghubClient } from "@azure/connectors/generated/SigninghubExtensions";

const CONNECTION_URL = process.env.SIGNINGHUB_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: SIGNINGHUB_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new SigninghubClient(CONNECTION_URL, tokenProvider);

    // Example 1: Download a document attachment.
    const packageId = process.env.SIGNINGHUB_PACKAGE_ID ?? "pkg123";
    const documentId = process.env.SIGNINGHUB_DOCUMENT_ID ?? "doc123";
    const attachmentId = process.env.SIGNINGHUB_ATTACHMENT_ID ?? "att123";
    try {
        const attachment = await client.attachmentDownloadAttachmentAsync(packageId, documentId, attachmentId);
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
