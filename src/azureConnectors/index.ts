// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Azure Logic Apps Connector SDK for TypeScript / Node.js.
 *
 * This package provides infrastructure for calling Azure Logic Apps connectors
 * from TypeScript/Node.js applications, including authentication, HTTP clients,
 * and strongly-typed generated connector clients.
 */

export type { AbortSignalLike } from "@azure/abort-controller";
export type { TokenCredential } from "@azure/core-auth";
export { ConnectorClientBase } from "./clientBase.ts";
export { DefaultConnectorClientOptions } from "./options.ts";
export type { ConnectorClientOptions } from "./options.ts";
export {
    ManagedIdentityTokenProvider,
    ConnectionStringTokenProvider,
} from "./authentication.ts";
export { ConnectorException } from "./connectorException.ts";
export { ConnectorHttpClient, ConnectorResponse } from "./connectorHttpClient.ts";
export { TriggerCallbackPayload, TriggerCallbackBody } from "./triggerPayload.ts";
