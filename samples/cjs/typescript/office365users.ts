// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Office 365 Users Connector SDK Sample — CJS TypeScript
 *
 * Demonstrates how to use the Office 365 Users connector with CommonJS module output in TypeScript.
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
 *   Run with tsx (dev):
 *     npx tsx office365users.ts
 *
 *   Or compile and run:
 *     npm run build
 *     node dist/office365users.js
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { Office365usersClient, MyTrendingDocumentsResponse, DirectReportsResponse } from "@azure/connectors/generated/Office365usersExtensions";

const CONNECTION_URL = process.env.OFFICE365USERS_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: OFFICE365USERS_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    console.log("Office 365 Users Connector SDK — CJS TypeScript Sample");
    console.log("=".repeat(55));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new Office365usersClient(CONNECTION_URL, tokenProvider);

    // Example 1: Get my profile
    console.log("\n--- My Profile ---");
    try {
        const profile = await client.myProfileAsync();
        const record = profile as Record<string, unknown>;

        console.log(`  Display Name: ${record.DisplayName ?? record.displayName ?? "Unknown"}`);
        console.log(`  Email: ${record.Mail ?? record.mail ?? "Unknown"}`);
        console.log(`  Job Title: ${record.JobTitle ?? record.jobTitle ?? "Unknown"}`);
        console.log(`  Department: ${record.Department ?? record.department ?? "Unknown"}`);
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
        const trendingResponse: MyTrendingDocumentsResponse = await client.myTrendingDocumentsAsync();
        const docs = trendingResponse.value ?? [];

        if (docs.length > 0) {
            console.log(`Found ${docs.length} trending documents:`);
            for (const doc of docs.slice(0, 5)) {
                const record = doc as Record<string, unknown>;
                const resource = record.resourceVisualization as Record<string, unknown> ?? {};
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
        const reports: DirectReportsResponse = await client.directReportsAsync();
        const reportValues = reports.value ?? [];

        if (reportValues.length > 0) {
            console.log(`Found ${reportValues.length} direct reports:`);
            for (const report of reportValues.slice(0, 5)) {
                const record = report as Record<string, unknown>;
                console.log(`  - ${record.DisplayName ?? record.displayName ?? "Unknown"} (${record.Mail ?? record.mail ?? "no email"})`);
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

    // Example 4: Search for a user
    const searchUser = process.env.OFFICE365USERS_SEARCH_TERM;
    if (searchUser) {
        console.log(`\n--- Search for User ("${searchUser}") ---`);
        try {
            const results = await client.searchUserAsync(searchUser);
            const users = results.value ?? [];

            if (users.length > 0) {
                console.log(`Found ${users.length} matching users:`);
                for (const user of users.slice(0, 5)) {
                    const record = user as Record<string, unknown>;
                    console.log(`  - ${record.DisplayName ?? "Unknown"} (${record.Mail ?? "no email"})`);
                }
            } else {
                console.log("No matching users found.");
            }
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }
    }

    console.log("\n" + "=".repeat(55));
    console.log("Sample completed!");
}

main().catch(console.error);
