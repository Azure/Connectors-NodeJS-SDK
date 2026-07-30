// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Excel Online Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates using the Excel Online connector with ESM imports in TypeScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:EXCELONLINE_CONNECTION_URL = "https://[region].azure-apihub.net/apim/excelonline/[connection-id]"
 *     $env:EXCEL_DRIVE_ID = "[drive id]"
 *     $env:EXCEL_FILE_ID  = "[workbook file id]"
 *
 *   Run with tsx (dev):
 *     npx tsx excelonline.ts
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { ExcelonlineClient } from "@azure/connectors/generated/ExcelonlineExtensions";

const CONNECTION_URL = process.env.EXCELONLINE_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: EXCELONLINE_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new ExcelonlineClient(CONNECTION_URL, tokenProvider);

    const driveId = process.env.EXCEL_DRIVE_ID;
    const fileId = process.env.EXCEL_FILE_ID;
    if (!driveId || !fileId) {
        console.log("Set EXCEL_DRIVE_ID and EXCEL_FILE_ID to list workbook tables.");
        return;
    }

    // Example: List the tables in a workbook.
    try {
        const tables = await client.getTablesAsync(driveId, fileId);
        console.log("Tables:", JSON.stringify(tables, null, 2));
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
