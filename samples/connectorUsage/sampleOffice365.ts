// Copyright (c) Microsoft Corporation. All rights reserved.

/**
 * Office365 Connector SDK Sample
 *
 * This sample demonstrates how to use the Office365 connector SDK for TypeScript.
 *
 * Prerequisites:
 * 1. Azure subscription with Office365 connection
 * 2. Office365 connection in Azure Logic Apps
 * 3. Connection runtime URL from Azure Portal
 *
 * Installation:
 *     npm install @azure/azure-connectors
 *
 * Usage:
 *     Set environment variable:
 *     $env:OFFICE365_CONNECTION_URL = "https://[region].azure-apihub.net/apim/office365/[connection-id]"
 *
 *     npx tsx sampleOffice365.ts
 */

import { DefaultAzureCredential } from "@azure/identity";
import {
    Office365Client,
    ClientSendHtmlMessage,
    ClientDraftHtmlMessage,
} from "../../src/generated/Office365Extensions";
import { ConnectorException } from "../../src/azureConnectors/connectorException";
import { ManagedIdentityTokenProvider } from "../../src/azureConnectors/authentication";

// Connection runtime URL format:
// https://[region].azure-apihub.net/apim/office365/[connection-id]
const CONNECTION_RUNTIME_URL = process.env.OFFICE365_CONNECTION_URL ?? "";

function createClient(): Office365Client {
    const tokenProvider = new ManagedIdentityTokenProvider();

    return new Office365Client(CONNECTION_RUNTIME_URL, tokenProvider);
}

async function example1GetOutlookCategories(): Promise<void> {
    console.log("\n=== Example 1: Get Outlook Category Names ===");

    const client = createClient();

    try {
        const categories = await client.getOutlookCategoryNamesAsync();

        if (categories && categories.length > 0) {
            console.log(`Found ${categories.length} Outlook categories:`);
            for (const category of categories.slice(0, 5)) {
                console.log(`  - ${category.displayName ?? "Unknown"}`);
            }
        } else {
            console.log("No categories found or unexpected response format.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error: ${error.message}`);
        } else {
            console.log(`Error: ${error}`);
        }
    }
}

async function example2SendEmail(): Promise<void> {
    console.log("\n=== Example 2: Send Email ===");

    const toAddress = process.env.TEST_EMAIL_TO ?? "<YOUR-EMAIL>@microsoft.com";

    const client = createClient();

    try {
        const email: ClientSendHtmlMessage = {
            To: toAddress,
            Subject: "Test Email from Office365 Connector SDK",
            Body: "<p>This is a test email sent from the <strong>TypeScript Office365 Connector SDK</strong>.</p>",
        };

        await client.sendEmailAsync(email);
        console.log(`Email sent successfully to ${toAddress}`);
        console.log("Note: Set TEST_EMAIL_TO environment variable to send to a real address");
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error: ${error.message}`);
        } else {
            console.log(`Error: ${error}`);
        }
    }
}

async function example3GetEmails(): Promise<void> {
    console.log("\n=== Example 3: Get Emails from Inbox ===");

    const client = createClient();

    try {
        const emails = await client.getEmailsAsync() as Record<string, unknown>;
        const emailList = (emails?.value ?? []) as Array<Record<string, unknown>>;

        if (emailList.length > 0) {
            console.log(`Found ${emailList.length} emails:`);
            for (const email of emailList) {
                console.log(`  - ${email.subject ?? "No Subject"}`);
                console.log(`    From: ${email.from ?? "Unknown"}`);
                console.log(`    Received: ${email.receivedDateTime ?? "Unknown"}`);
            }
        } else {
            console.log("No emails found or unexpected response format.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error: ${error.message}`);
        } else {
            console.log(`Error: ${error}`);
        }
    }
}

async function example4DraftAndSendEmail(): Promise<void> {
    console.log("\n=== Example 4: Draft and Send Email ===");

    const toAddress = process.env.TEST_EMAIL_TO ?? "<YOUR-EMAIL>@microsoft.com";

    const client = createClient();

    try {
        const draft: ClientDraftHtmlMessage = {
            To: toAddress,
            Subject: "Draft Email from SDK",
            Body: "<p>This email was created as a draft first.</p>",
        };

        const draftResponse = await client.draftEmailAsync(draft) as Record<string, unknown>;
        console.log("Draft created successfully");

        if (draftResponse?.Id) {
            console.log(`Draft message ID: ${draftResponse.Id}`);

            await client.sendDraftEmailAsync(draftResponse.Id as string);
            console.log(`Draft email sent successfully to ${toAddress}`);
        } else {
            console.log("Draft created but no ID returned.");
        }
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error: ${error.message}`);
        } else {
            console.log(`Error: ${error}`);
        }
    }
}

async function example5ErrorHandling(): Promise<void> {
    console.log("\n=== Example 5: Error Handling ===");

    const client = createClient();

    try {
        const invalidMessageId = "invalid-message-id-12345";
        const email = await client.getEmailAsync(invalidMessageId);
        console.log(`Unexpected success: ${JSON.stringify(email)}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log("Expected error caught:");
            console.log(`  Message: ${error.message}`);
        } else {
            console.log(`Unexpected error type: ${(error as Error).constructor.name}`);
            console.log(`  Message: ${error}`);
        }
    }
}

async function main(): Promise<void> {
    console.log("Office365 Connector SDK - Sample Usage");
    console.log("=".repeat(50));

    await example1GetOutlookCategories();
    await example2SendEmail();
    await example3GetEmails();
    await example4DraftAndSendEmail();
    await example5ErrorHandling();

    console.log("\n" + "=".repeat(50));
    console.log("Sample completed!");
}

main().catch(console.error);
