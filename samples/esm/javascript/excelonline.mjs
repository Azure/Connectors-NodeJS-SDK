// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Excel Online Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates using the Excel Online connector with ESM imports in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:EXCELONLINE_CONNECTION_URL = "https://[region].azure-apihub.net/apim/excelonline/[connection-id]"
 *     $env:EXCEL_DRIVE_ID = "[drive id]"
 *     $env:EXCEL_FILE_ID  = "[workbook file id]"
 *
 *   Run:
 *     npm start
 */

import { ManagedIdentityTokenProvider, ConnectorError } from "@azure/connectors";
import { ExcelonlineClient } from "@azure/connectors/generated/ExcelonlineExtensions";

const CONNECTION_URL = process.env.EXCELONLINE_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: EXCELONLINE_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new ExcelonlineClient(CONNECTION_URL, tokenProvider);

    const driveId = process.env.EXCEL_DRIVE_ID;
    const fileId = process.env.EXCEL_FILE_ID;
    const source = process.env.EXCEL_SOURCE;
    if (!driveId || !fileId || !source) {
        console.log("Set EXCEL_DRIVE_ID, EXCEL_FILE_ID, and EXCEL_SOURCE to list workbook tables.");
        return;
    }

    // Example: List the tables in a workbook.
    try {
        const tables = await client.getTables(driveId, fileId, source);
        console.log("Tables:", JSON.stringify(tables, null, 2));
    } catch (error) {
        if (error instanceof ConnectorError) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
            return;
        }

        throw error;
    }
}

main().catch(console.error);
