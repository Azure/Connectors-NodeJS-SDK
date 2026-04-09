/**
 * @fileoverview Common type definitions used across connectors
 */

/**
 * Generic list response wrapper.
 */
export interface ListResponse<T> {
    /**
     * The list of items.
     */
    value?: T[];

    /**
     * The total count of items.
     */
    count?: number;

    /**
     * Next link for pagination.
     */
    nextLink?: string;
}

/**
 * Blob metadata for file operations.
 */
export interface BlobMetadata {
    /**
     * The unique identifier of the blob.
     */
    id?: string;

    /**
     * The name of the blob.
     */
    name?: string;

    /**
     * The display name of the blob.
     */
    displayName?: string;

    /**
     * The full path to the blob.
     */
    path?: string;

    /**
     * The size of the blob in bytes.
     */
    size?: number;

    /**
     * The media type/MIME type of the blob.
     */
    mediaType?: string;

    /**
     * Indicates whether this is a folder.
     */
    isFolder?: boolean;

    /**
     * The last modified timestamp.
     */
    lastModified?: string;

    /**
     * The creation timestamp.
     */
    created?: string;
}

/**
 * Trigger callback payload base structure.
 * Envelope type for AI Gateway trigger callback payloads.
 * The AI Gateway wraps triggerBody() in a {"body":{"value":[...]}} structure.
 */
export interface TriggerCallbackPayload<T = any> {
    /**
     * The trigger body containing the actual data.
     */
    body?: TriggerCallbackBody<T>;

    /**
     * Trigger metadata.
     */
    metadata?: Record<string, any>;

    /**
     * Headers from the trigger request.
     */
    headers?: Record<string, string>;
}

/**
 * Inner body of the AI Gateway trigger callback, containing the array of trigger items.
 */
export interface TriggerCallbackBody<T = any> {
    /**
     * The list of trigger items delivered by the connector trigger.
     * Split-on is not supported — consumers must iterate this array.
     */
    value?: T[];
}