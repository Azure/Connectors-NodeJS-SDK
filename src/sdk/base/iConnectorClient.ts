/**
 * @fileoverview Base interface for connector clients
 */

/**
 * Marker interface for connector clients.
 */
export interface IConnectorClient {
    /**
     * Gets the connector name.
     */
    readonly connectorName: string;

    /**
     * Disposes the connector client and releases resources.
     */
    dispose(): Promise<void>;
}