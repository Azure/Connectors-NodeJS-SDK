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
export type { PagedAsyncIterableIterator } from "@azure/core-paging";
export { ConnectorClientBase } from "./clientBase.ts";
export type { ConnectorPageSettings, ConnectorPagedAsyncIterableIterator } from "./clientBase.ts";
export { DefaultConnectorClientOptions } from "./options.ts";
export type { ConnectorClientOptions, ConnectorOperationOptions } from "./options.ts";
export {
    ManagedIdentityTokenProvider,
    ConnectionStringTokenProvider,
} from "./authentication.ts";
export { ConnectorError } from "./connectorError.ts";
export { ConnectorHttpClient, ConnectorResponse } from "./connectorHttpClient.ts";
export { logger } from "./logger.ts";
export { TriggerCallbackPayload, TriggerCallbackBody } from "./triggerPayload.ts";
