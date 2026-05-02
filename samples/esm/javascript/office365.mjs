// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Office365 Connector SDK Sample — ESM JavaScript
 *
 * Demonstrates how to use the Office365 connector with ESM imports in plain JavaScript.
 *
 * Prerequisites:
 *   1. Azure subscription with Office365 connection via AI Gateway
 *   2. Connection runtime URL from Azure Portal
 *   3. npm install in this folder
 *
 * Usage:
 *   Set environment variable:
 *     $env:OFFICE365_CONNECTION_URL = "https://[region].azure-apihub.net/apim/office365/[connection-id]"
 *
 *   Run:
 *     npm start
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/azure-connectors";
import { Office365Client } from "@azure/azure-connectors/generated/Office365Extensions";

const CONNECTION_URL = process.env.OFFICE365_CONNECTION_URL ?? "";

if (!CONNECTION_URL) {
    console.error("Error: OFFICE365_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main() {
    console.log("Office365 Connector SDK — ESM JavaScript Sample");
    console.log("=".repeat(50));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new Office365Client(CONNECTION_URL, tokenProvider);

    // Example 1: Get Outlook categories
    console.log("\n--- Get Outlook Categories ---");
    try {
        const categories = await client.getOutlookCategoryNamesAsync();

        if (categories && categories.length > 0) {
            console.log(`Found ${categories.length} categories:`);
            for (const category of categories.slice(0, 5)) {
                console.log(`  - ${category.displayName ?? "Unknown"}`);
            }
        } else {
            console.log("No categories found.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error: ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: Send Email
    console.log("\n--- Send Email ---");
    try {
        /** @type {{ To: string, Subject: string, Body: string }} */
        const email = {
            To: process.env.TEST_EMAIL_TO ?? "test@example.com",
            Subject: "Test from ESM JavaScript Sample",
            Body: "<p>Hello from the <strong>ESM JavaScript</strong> sample!</p>",
        };

        await client.sendEmailAsync(email);
        console.log("Email sent successfully.");
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error: ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 3: Get Emails
    console.log("\n--- Get Emails ---");
    try {
        const emails = await client.getEmailsAsync();
        const emailList = emails?.value ?? [];
        console.log(`Found ${emailList.length} emails in inbox.`);
        for (const email of emailList.slice(0, 3)) {
            console.log(`  - ${email.subject ?? "No Subject"}`);
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error: ${error.message}`);
        } else {
            throw error;
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Sample completed!");
}

main().catch(console.error);
