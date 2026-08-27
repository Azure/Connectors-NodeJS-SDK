// Copyright (c) Microsoft Corporation.  All rights reserved.

/** Typeform Connector SDK Sample - ESM TypeScript. */
import { ManagedIdentityTokenProvider } from "@azure/connectors";
import { TypeformClient, TypeformTriggerOperations } from "@azure/connectors/generated/TypeformExtensions";

const CONNECTION_URL = process.env.TYPEFORM_CONNECTION_URL ?? "";
if (!CONNECTION_URL) throw new Error("TYPEFORM_CONNECTION_URL is required.");

const client = new TypeformClient(CONNECTION_URL, new ManagedIdentityTokenProvider());
console.log("Connector:", client.connectorName);
console.log("New response trigger operation:", TypeformTriggerOperations.OnNewResponseWebhook);