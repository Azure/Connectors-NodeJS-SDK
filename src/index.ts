/**
 * @fileoverview Azure Connectors NodeJS SDK
 * TypeScript SDK for Azure Logic Apps Connectors DirectClient functionality
 * 
 * @author Microsoft Corporation
 * @license MIT
 */

// Core SDK exports
export * from './sdk/base/connectorClientBase';
export * from './sdk/base/connectorClientOptions';
export * from './sdk/base/connectorResponse';
export * from './sdk/base/iConnectorClient';

// Authentication exports
export * from './sdk/authentication/tokenProvider';
export * from './sdk/authentication/msalTokenProvider';

// Client exports
export * from './sdk/clients/office365Client';
export * from './sdk/clients/sharepointonlineClient';
export * from './sdk/clients/teamsClient';

// Type exports
export * from './sdk/types/office365Types';
export * from './sdk/types/sharePointTypes';
export * from './sdk/types/teamsTypes';
export * from './sdk/types/commonTypes';

// Constants
export * from './sdk/constants/connectorNames';

// Utilities
export * from './sdk/utils/httpClient';
export * from './sdk/utils/exceptions';