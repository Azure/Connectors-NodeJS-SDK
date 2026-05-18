// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Office 365 Users Connector SDK Sample — CJS JavaScript
 *
 * Demonstrates how to use the Office 365 Users connector with CommonJS require() in plain JavaScript.
 *
 * Prerequisites:
 *   1. Azure subscription with Office 365 Users connection via AI Gateway
 *   2. Connection runtime URL from Azure Portal
 *   3. npm install in this folder
 *
 * Usage:
 *   Set environment variable:
 *     $env:OFFICE365USERS_CONNECTION_URL = "https://[region].azure-apihub.net/apim/office365users/[connection-id]"
 *
 *   Run:
 *     npm start
 */

"use strict";

const { ManagedIdentityTokenProvider, ConnectorException } = require("@azure/connectors");
const { Office365usersClient } = require("@azure/connectors/generated/Office365usersExtensions");

const CONNECTION_URL = process.env.OFFICE365USERS_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: OFFICE365USERS_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    console.log("Office 365 Users Connector SDK — CJS JavaScript Sample");
    console.log("=".repeat(55));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new Office365usersClient(CONNECTION_URL, tokenProvider);

    // Example 1: Get my profile
    console.log("\n--- My Profile ---");
    try {
        const profile = await client.myProfileAsync();
        console.log(`  Display Name: ${profile.DisplayName ?? profile.displayName ?? "Unknown"}`);
        console.log(`  Email: ${profile.Mail ?? profile.mail ?? "Unknown"}`);
        console.log(`  Job Title: ${profile.JobTitle ?? profile.jobTitle ?? "Unknown"}`);
        console.log(`  Department: ${profile.Department ?? profile.department ?? "Unknown"}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error: ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: Get my trending documents
    console.log("\n--- Trending Documents ---");
    try {
        const trendingResponse = await client.myTrendingDocumentsAsync();
        const docs = trendingResponse.value ?? [];

        if (docs.length > 0) {
            console.log(`Found ${docs.length} trending documents:`);
            for (const doc of docs.slice(0, 5)) {
                const resource = doc.resourceVisualization ?? {};
                console.log(`  - ${resource.title ?? "Untitled"} (${resource.type ?? "unknown type"})`);
            }
        } else {
            console.log("No trending documents found.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 3: Get my direct reports
    console.log("\n--- My Direct Reports ---");
    try {
        const reports = await client.directReportsAsync();
        const reportValues = reports.value ?? [];

        if (reportValues.length > 0) {
            console.log(`Found ${reportValues.length} direct reports:`);
            for (const report of reportValues.slice(0, 5)) {
                console.log(`  - ${report.DisplayName ?? report.displayName ?? "Unknown"} (${report.Mail ?? report.mail ?? "no email"})`);
            }
        } else {
            console.log("No direct reports found.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    console.log("\n" + "=".repeat(55));
    console.log("Sample completed!");
}

main().catch(console.error);
