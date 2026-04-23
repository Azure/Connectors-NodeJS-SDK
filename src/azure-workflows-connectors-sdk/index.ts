// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Azure Logic Apps Connector SDK for TypeScript / Node.js.
 *
 * This package provides infrastructure for calling Azure Logic Apps connectors
 * from TypeScript/Node.js applications, including authentication, HTTP clients,
 * and strongly-typed generated connector clients.
 */

export { ConnectorClientBase } from "./clientBase";
export { ConnectorClientOptions, DefaultConnectorClientOptions } from "./options";
export {
    TokenProvider,
    ManagedIdentityTokenProvider,
    ConnectionStringTokenProvider,
} from "./authentication";
export { ConnectorException } from "./connectorException";
export { ConnectorHttpClient, ConnectorResponse } from "./connectorHttpClient";
export { TriggerCallbackPayload, TriggerCallbackBody } from "./triggerPayload";
