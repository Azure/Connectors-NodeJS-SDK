// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * PDF.co Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates using the PDF.co connector with ESM imports in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:PDFCO_CONNECTION_URL = "https://[region].azure-apihub.net/apim/pdfco/[connection-id]"
 *     $env:PDFCO_SOURCE_URL     = "[optional web page URL to convert]"
 *
 *   Run with tsx (dev):
 *     npx tsx pdfco.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { PdfcoClient } from "@azure/connectors/generated/PdfcoExtensions";

const CONNECTION_URL = process.env.PDFCO_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: PDFCO_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new PdfcoClient(CONNECTION_URL, tokenProvider);

    // Example 1: Convert a web page to a PDF document.
    const sourceUrl = process.env.PDFCO_SOURCE_URL ?? "https://example.com";
    try {
        const result = await client.urlToPdfAsync({ url: sourceUrl });
        console.log("PDF result:", JSON.stringify(result, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
