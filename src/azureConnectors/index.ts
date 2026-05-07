// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Azure Logic Apps Connector SDK for TypeScript / Node.js.
 *
 * This package provides infrastructure for calling Azure Logic Apps connectors
 * from TypeScript/Node.js applications, including authentication, HTTP clients,
 * and strongly-typed generated connector clients.
 */

export { ConnectorClientBase } from "./clientBase.ts";
export { ConnectorClientOptions, DefaultConnectorClientOptions } from "./options.ts";
export {
    TokenProvider,
    ManagedIdentityTokenProvider,
    ConnectionStringTokenProvider,
} from "./authentication.ts";
export { ConnectorException } from "./connectorException.ts";
export { ConnectorHttpClient, ConnectorResponse } from "./connectorHttpClient.ts";
export { TriggerCallbackPayload, TriggerCallbackBody } from "./triggerPayload.ts";
