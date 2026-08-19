// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Cloudmersive Document Conversion Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates using the Cloudmersive Document Conversion connector with ESM imports in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:CLOUDMERSIVECONVERT_CONNECTION_URL = "https://[region].azure-apihub.net/apim/cloudmersiveconvert/[connection-id]"
 *
 *   Run with tsx (dev):
 *     npx tsx cloudmersiveconvert.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { CloudmersiveconvertClient } from "@azure/connectors/generated/CloudmersiveconvertExtensions";

const CONNECTION_URL = process.env.CLOUDMERSIVECONVERT_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: CLOUDMERSIVECONVERT_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new CloudmersiveconvertClient(CONNECTION_URL, tokenProvider);

    // Example 1: Create a blank DOCX document with some initial text.
    try {
        const document = await client.editDocumentDocxCreateBlankDocumentAsync({ InitialText: "Hello world" });
        console.log("Blank document:", JSON.stringify(document, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
