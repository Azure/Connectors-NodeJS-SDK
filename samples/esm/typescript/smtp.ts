// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * SMTP Connector SDK Sample — ESM TypeScript
 *
 * Demonstrates how to use the SMTP connector with ESM imports in TypeScript.
 *
 * Prerequisites:
 *   1. Azure subscription with SMTP connection via AI Gateway
 *   2. Connection runtime URL from Azure Portal
 *   3. npm install in this folder
 *
 * Usage:
 *   Set environment variables:
 *     $env:SMTP_CONNECTION_URL = "https://[region].azure-apihub.net/apim/smtp/[connection-id]"
 *     $env:SMTP_FROM = "sender@example.com"
 *     $env:SMTP_TO = "recipient@example.com"
 *
 *   Run with tsx (dev):
 *     npx tsx smtp.ts
 *
 *   Or compile and run:
 *     npm run build
 *     node dist/smtp.js
 */

import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { SmtpClient, Email } from "@azure/connectors/generated/SmtpExtensions";

const CONNECTION_URL = process.env.SMTP_CONNECTION_URL ?? "";
const FROM_ADDRESS = process.env.SMTP_FROM ?? "sender@example.com";
const TO_ADDRESS = process.env.SMTP_TO ?? "recipient@example.com";

if (!CONNECTION_URL) {
    console.error("Error: SMTP_CONNECTION_URL environment variable is not set.");
    process.exit(1);
}

async function main(): Promise<void> {
    console.log("SMTP Connector SDK — ESM TypeScript Sample");
    console.log("=".repeat(50));

    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new SmtpClient(CONNECTION_URL, tokenProvider);

    // Example 1: Send a simple email
    console.log("\n--- Send Email ---");
    try {
        const email: Email = {
            From: FROM_ADDRESS,
            To: TO_ADDRESS,
            Subject: `Test from SMTP SDK Sample (${new Date().toISOString()})`,
            Body: "<p>Hello from the <strong>SMTP TypeScript SDK</strong> sample!</p>",
        };

        await client.sendEmailAsync(email);
        console.log("Email sent successfully.");
        console.log(`  From: ${FROM_ADDRESS}`);
        console.log(`  To: ${TO_ADDRESS}`);
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log(`Connector error (${error.statusCode}): ${error.message}`);
        } else {
            throw error;
        }
    }

    // Example 2: Send email with CC and BCC
    const ccAddress = process.env.SMTP_CC;
    if (ccAddress) {
        console.log("\n--- Send Email with CC ---");
        try {
            const email: Email = {
                From: FROM_ADDRESS,
                To: TO_ADDRESS,
                CC: ccAddress,
                Subject: `CC Test from SMTP SDK Sample (${new Date().toISOString()})`,
                Body: "<p>This email has a CC recipient.</p>",
            };

            await client.sendEmailAsync(email);
            console.log("Email with CC sent successfully.");
        } catch (error) {
            if (error instanceof ConnectorException) {
                console.log(`Connector error (${error.statusCode}): ${error.message}`);
            } else {
                throw error;
            }
        }
    }

    // Example 3: Error handling — invalid address
    console.log("\n--- Error Handling ---");
    try {
        const badEmail: Email = {
            From: "",
            To: "",
            Subject: "This should fail",
            Body: "Test",
        };

        await client.sendEmailAsync(badEmail);
        console.log("Unexpected success.");
    } catch (error) {
        if (error instanceof ConnectorException) {
            console.log("Expected error caught:");
            console.log(`  Message: ${error.message}`);
            console.log(`  Status: ${error.statusCode}`);
        } else {
            console.log(`Unexpected error type: ${(error as Error).constructor.name}`);
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Sample completed!");
}

main().catch(console.error);
