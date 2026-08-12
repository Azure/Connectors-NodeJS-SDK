// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * FTP Connector SDK Sample — CJS JavaScript
 *
 * Demonstrates using the FTP connector with CommonJS require() in plain JavaScript.
 *
 * Usage:
 *   Set environment variables:
 *     $env:FTP_CONNECTION_URL = "https://[region].azure-apihub.net/apim/ftp/[connection-id]"
 *     $env:FTP_TEST_FILE_ID   = "[optional file id]"
 *
 *   Run:
 *     npm start
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { FtpClient } = require("@azure/connectors/generated/FtpExtensions");

const CONNECTION_URL = process.env.FTP_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: FTP_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new FtpClient(CONNECTION_URL, tokenProvider);

    // Example 1: List the root folder.
    try {
        const files = await client.listRootFolderAsync();
        console.log(`Found ${files.length} item(s) in the root folder.`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: Get file metadata by id (requires FTP_TEST_FILE_ID).
    const fileId = process.env.FTP_TEST_FILE_ID;
    if (fileId) {
        try {
            const metadata = await client.getFileMetadataAsync(fileId);
            console.log("File metadata:", JSON.stringify(metadata, null, 2));
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }
    } else {
        console.log("Set FTP_TEST_FILE_ID to fetch file metadata.");
    }
}

main().catch(console.error);
