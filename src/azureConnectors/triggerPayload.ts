// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * Trigger callback payload types for AI Gateway integration.
 *
 * Mirrors the Python SDK's trigger_payload.py.
 */

/**
 * Inner body of the AI Gateway trigger callback, containing the array of trigger items.
 */
export interface TriggerCallbackBody<TItem> {
    /**
     * The list of trigger items delivered by the connector trigger.
     * Split-on is not supported — consumers must iterate this array.
     */
    value?: TItem[];
}

/**
 * Envelope type for AI Gateway trigger callback payloads.
 *
 * The AI Gateway wraps triggerBody() in a {"body":{"value":[...]}} structure.
 *
 * Type parameter TItem is the connector-specific trigger item type
 * (e.g., GraphClientReceiveMessage for Office 365 email triggers).
 */
export interface TriggerCallbackPayload<TItem> {
    /** The body envelope containing the trigger items. */
    body?: TriggerCallbackBody<TItem>;
}
