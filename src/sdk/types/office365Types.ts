/**
 * @fileoverview Type definitions for Office 365 connector
 */

import { ListResponse, TriggerCallbackPayload } from './commonTypes';

/**
 * Request model for sending HTML email.
 */
export interface ClientSendHtmlMessage {
    /**
     * The recipient email address.
     */
    to?: string;

    /**
     * The email subject.
     */
    subject?: string;

    /**
     * The HTML body of the email.
     */
    body?: string;

    /**
     * CC recipients (semicolon separated).
     */
    cc?: string;

    /**
     * BCC recipients (semicolon separated).
     */
    bcc?: string;

    /**
     * The importance of the email.
     */
    importance?: 'Low' | 'Normal' | 'High';

    /**
     * Attachments for the email.
     */
    attachments?: EmailAttachment[];
}

/**
 * Email attachment definition.
 */
export interface EmailAttachment {
    /**
     * The name of the attachment.
     */
    name?: string;

    /**
     * The content type of the attachment.
     */
    contentType?: string;

    /**
     * The base64-encoded content of the attachment.
     */
    contentBytes?: string;
}

/**
 * Calendar event for creation/update.
 */
export interface GraphCalendarEventClient {
    /**
     * The subject of the event.
     */
    subject?: string;

    /**
     * The body/description of the event.
     */
    body?: string;

    /**
     * The start time (ISO 8601 format).
     */
    startTime?: string;

    /**
     * The end time (ISO 8601 format).
     */
    endTime?: string;

    /**
     * The time zone identifier.
     */
    timeZone?: string;

    /**
     * Required attendees (semicolon separated).
     */
    requiredAttendees?: string;

    /**
     * Optional attendees (semicolon separated).
     */
    optionalAttendees?: string;

    /**
     * The location of the event.
     */
    location?: string;

    /**
     * Whether this is an all-day event.
     */
    isAllDay?: boolean;
}

/**
 * Received calendar event from API.
 */
export interface GraphCalendarEventClientReceive {
    /**
     * The unique identifier of the event.
     */
    iCalUId?: string;

    /**
     * The subject of the event.
     */
    subject?: string;

    /**
     * The body/description of the event.
     */
    body?: string;

    /**
     * The start time (ISO 8601 format).
     */
    startTime?: string;

    /**
     * The end time (ISO 8601 format).
     */
    endTime?: string;

    /**
     * The time zone identifier.
     */
    timeZone?: string;

    /**
     * The location of the event.
     */
    location?: string;

    /**
     * Whether this is an all-day event.
     */
    isAllDay?: boolean;

    /**
     * The organizer of the event.
     */
    organizer?: string;

    /**
     * The attendees of the event.
     */
    attendees?: string[];
}

/**
 * Email message received from API.
 */
export interface GraphClientReceiveMessage {
    /**
     * The message ID.
     */
    messageId?: string;

    /**
     * The sender email address.
     */
    from?: string;

    /**
     * The recipient email addresses.
     */
    to?: string;

    /**
     * The subject of the email.
     */
    subject?: string;

    /**
     * The body preview of the email.
     */
    bodyPreview?: string;

    /**
     * The full body of the email.
     */
    body?: string;

    /**
     * The importance of the email.
     */
    importance?: string;

    /**
     * Whether the email has attachments.
     */
    hasAttachment?: boolean;

    /**
     * The received time (ISO 8601 format).
     */
    receivedTime?: string;

    /**
     * Whether the email is read.
     */
    isRead?: boolean;
}

/**
 * Response containing list of calendar events.
 */
export interface GraphCalendarEventListClientReceive extends ListResponse<GraphCalendarEventClientReceive> {
}

/**
 * Trigger payload for new email events.
 */
export interface Office365OnNewEmailV3TriggerPayload extends TriggerCallbackPayload<ListResponse<GraphClientReceiveMessage>> {
}