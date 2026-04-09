/**
 * Connector Names Constants
 * 
 * This module defines string constants for connector names used throughout
 * the Connectors NodeJS SDK. These constants ensure type safety and prevent
 * typos when referencing connector names.
 */

/**
 * Readonly object containing connector name constants.
 * Each property represents a connector type with its associated string value.
 */
export const ConnectorNames = {
  /** Microsoft Office 365 Connector */
  Office365: 'office365' as const,
  
  /** SharePoint Online Connector */
  SharePointOnline: 'sharepointonline' as const,
  
  /** Microsoft Teams Connector */
  Teams: 'teams' as const
} as const;

/**
 * Type representing all possible connector name values.
 * This creates a union type of all the connector name string literals.
 */
export type ConnectorName = typeof ConnectorNames[keyof typeof ConnectorNames];

/**
 * Array of all connector names for iteration and validation purposes.
 */
export const CONNECTOR_NAMES_ARRAY: readonly ConnectorName[] = Object.values(ConnectorNames);

/**
 * Set of all connector names for fast lookup operations.
 */
export const CONNECTOR_NAMES_SET: ReadonlySet<ConnectorName> = new Set(CONNECTOR_NAMES_ARRAY);

/**
 * Type guard to check if a string is a valid connector name.
 * 
 * @param value - The string to check
 * @returns True if the value is a valid connector name
 */
export function isValidConnectorName(value: string): value is ConnectorName {
  return CONNECTOR_NAMES_SET.has(value as ConnectorName);
}

/**
 * Validates a connector name and throws an error if invalid.
 * 
 * @param name - The connector name to validate
 * @throws Error if the connector name is not valid
 */
export function validateConnectorName(name: string): asserts name is ConnectorName {
  if (!isValidConnectorName(name)) {
    throw new Error(`Invalid connector name: ${name}. Valid names are: ${CONNECTOR_NAMES_ARRAY.join(', ')}`);
  }
}