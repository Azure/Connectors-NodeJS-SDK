/**
 * @fileoverview Office 365 Outlook connector client
 */

import { ConnectorClientBase } from '../base/connectorClientBase';
import { ConnectorClientOptions } from '../base/connectorClientOptions';
import { ITokenProvider } from '../authentication/tokenProvider';
import { ConnectorNames } from '../constants/connectorNames';
import { Office365ConnectorException } from '../utils/exceptions';
import {
    ClientSendHtmlMessage,
    GraphCalendarEventClient,
    GraphCalendarEventClientReceive,
    GraphCalendarEventListClientReceive,
    GraphClientReceiveMessage,
    Office365OnNewEmailV3TriggerPayload
} from '../types/office365Types';
import { ListResponse } from '../types/commonTypes';

/**
 * Client for Office 365 Outlook connector operations.
 */
export class Office365Client extends ConnectorClientBase {
    /**
     * Initializes a new instance of the Office365Client class.
     * @param connectionRuntimeUrl The connection runtime URL for the Office 365 connector endpoint.
     * @param tokenProvider The token provider for authentication.
     * @param options The connector client options.
     */
    constructor(connectionRuntimeUrl: string | undefined, tokenProvider: ITokenProvider, options?: ConnectorClientOptions) {
        super(connectionRuntimeUrl, tokenProvider, options);
    }

    /**
     * Gets the connector name.
     */
    public readonly connectorName: string = ConnectorNames.Office365;

    /**
     * Sends an email using the Office 365 connector.
     * @param message The email message to send.
     * @param cancellationToken Optional cancellation token.
     */
    public async sendEmailV2Async(
        message: ClientSendHtmlMessage, 
        cancellationToken?: AbortSignal
    ): Promise<void> {
        try {
            await this.postAsync(
                '/apim/office365/v2/Mail',
                message,
                { 'Content-Type': 'application/json' },
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleOffice365Error(error);
        }
    }

    /**
     * Gets the names of Outlook categories.
     * @param cancellationToken Optional cancellation token.
     */
    public async getOutlookCategoryNamesAsync(cancellationToken?: AbortSignal): Promise<string[]> {
        try {
            const result = await this.getAsync<{ value: string[] }>(
                '/apim/office365/v2/MailCategories',
                undefined,
                { signal: cancellationToken }
            );
            return result.value ?? [];
        } catch (error) {
            throw this.handleOffice365Error(error);
        }
    }

    /**
     * Creates a calendar event.
     * @param calendarId The calendar ID (default: 'Calendar').
     * @param eventData The event data.
     * @param cancellationToken Optional cancellation token.
     */
    public async v4CalendarPostItemAsync(
        calendarId: string,
        eventData: GraphCalendarEventClient,
        cancellationToken?: AbortSignal
    ): Promise<GraphCalendarEventClientReceive> {
        try {
            return await this.postAsync<GraphCalendarEventClientReceive>(
                `/apim/office365/v4/calendars/${encodeURIComponent(calendarId)}/events`,
                eventData,
                { 'Content-Type': 'application/json' },
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleOffice365Error(error);
        }
    }

    /**
     * Gets upcoming calendar events.
     * @param calendarId The calendar ID (default: 'Calendar').
     * @param cancellationToken Optional cancellation token.
     */
    public async getUpcomingEventsAsync(
        calendarId: string = 'Calendar',
        cancellationToken?: AbortSignal
    ): Promise<GraphCalendarEventListClientReceive> {
        try {
            return await this.getAsync<GraphCalendarEventListClientReceive>(
                `/apim/office365/v4/calendars/${encodeURIComponent(calendarId)}/events`,
                undefined,
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleOffice365Error(error);
        }
    }

    /**
     * Exports an email as RFC822 format.
     * @param messageId The message ID to export.
     * @param cancellationToken Optional cancellation token.
     */
    public async exportEmailV2Async(
        messageId: string,
        cancellationToken?: AbortSignal
    ): Promise<Buffer> {
        try {
            const response = await this.callConnectorBinaryAsync(
                'GET',
                `/apim/office365/v2/Mail/${encodeURIComponent(messageId)}/Export`,
                undefined,
                undefined,
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleOffice365Error(error);
        }
    }

    /**
     * Gets recent emails from the inbox.
     * @param top Optional number of emails to retrieve.
     * @param cancellationToken Optional cancellation token.
     */
    public async getRecentEmailsAsync(
        top?: number,
        cancellationToken?: AbortSignal
    ): Promise<any> {
        try {
            const queryParams = top ? `?$top=${top}` : '';
            return await this.getAsync<any>(
                `/apim/office365/v2/Mail${queryParams}`,
                undefined,
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleOffice365Error(error);
        }
    }

    /**
     * Marks an email as read.
     * @param messageId The message ID to mark as read.
     * @param cancellationToken Optional cancellation token.
     */
    public async markEmailAsReadAsync(
        messageId: string,
        cancellationToken?: AbortSignal
    ): Promise<void> {
        try {
            await this.patchAsync(
                `/apim/office365/v2/Mail/${encodeURIComponent(messageId)}`,
                { IsRead: true },
                { 'Content-Type': 'application/json' },
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleOffice365Error(error);
        }
    }

    /**
     * Gets the user's profile information.
     * @param cancellationToken Optional cancellation token.
     */
    public async getUserProfileAsync(cancellationToken?: AbortSignal): Promise<any> {
        try {
            return await this.getAsync<any>(
                '/apim/office365/v2/Me',
                undefined,
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleOffice365Error(error);
        }
    }

    /**
     * Gets a specific email by message ID.
     * @param messageId The message ID.
     * @param cancellationToken Optional cancellation token.
     */
    public async getEmailV2Async(
        messageId: string,
        cancellationToken?: AbortSignal
    ): Promise<GraphClientReceiveMessage> {
        try {
            return await this.getAsync<GraphClientReceiveMessage>(
                `/apim/office365/v2/Mail/${encodeURIComponent(messageId)}`,
                undefined,
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleOffice365Error(error);
        }
    }

    /**
     * Gets emails with optional filtering and pagination (V3).
     * @param folderPath Optional folder path (default: 'Inbox').
     * @param top Optional number of emails to retrieve.
     * @param skip Optional number of emails to skip.
     * @param filter Optional OData filter expression.
     * @param cancellationToken Optional cancellation token.
     */
    public async getEmailsV3Async(
        folderPath: string = 'Inbox',
        top?: number,
        skip?: number,
        filter?: string,
        cancellationToken?: AbortSignal
    ): Promise<ListResponse<GraphClientReceiveMessage>> {
        try {
            const queryParams: string[] = [];
            if (top !== undefined) queryParams.push(`$top=${top}`);
            if (skip !== undefined) queryParams.push(`$skip=${skip}`);
            if (filter) queryParams.push(`$filter=${encodeURIComponent(filter)}`);
            const qs = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
            return await this.getAsync<ListResponse<GraphClientReceiveMessage>>(
                `/apim/office365/v3/Mail/folders/${encodeURIComponent(folderPath)}/messages${qs}`,
                undefined,
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleOffice365Error(error);
        }
    }

    /**
     * Deletes an email by message ID.
     * @param messageId The message ID to delete.
     * @param cancellationToken Optional cancellation token.
     */
    public async deleteEmailV2Async(
        messageId: string,
        cancellationToken?: AbortSignal
    ): Promise<void> {
        try {
            await this.deleteAsync(
                `/apim/office365/v2/Mail/${encodeURIComponent(messageId)}`,
                undefined,
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleOffice365Error(error);
        }
    }

    /**
     * Gets calendar events from a specific calendar (V4).
     * @param calendarId The calendar ID (default: 'Calendar').
     * @param top Optional number of events to retrieve.
     * @param filter Optional OData filter expression.
     * @param cancellationToken Optional cancellation token.
     */
    public async v4CalendarGetItemsAsync(
        calendarId: string = 'Calendar',
        top?: number,
        filter?: string,
        cancellationToken?: AbortSignal
    ): Promise<GraphCalendarEventListClientReceive> {
        try {
            const queryParams: string[] = [];
            if (top !== undefined) queryParams.push(`$top=${top}`);
            if (filter) queryParams.push(`$filter=${encodeURIComponent(filter)}`);
            const qs = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
            return await this.getAsync<GraphCalendarEventListClientReceive>(
                `/apim/office365/v4/calendars/${encodeURIComponent(calendarId)}/events${qs}`,
                undefined,
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleOffice365Error(error);
        }
    }

    /**
     * Gets a specific calendar event by ID (V3).
     * @param calendarId The calendar ID (default: 'Calendar').
     * @param eventId The event ID.
     * @param cancellationToken Optional cancellation token.
     */
    public async v3CalendarGetItemAsync(
        calendarId: string,
        eventId: string,
        cancellationToken?: AbortSignal
    ): Promise<GraphCalendarEventClientReceive> {
        try {
            return await this.getAsync<GraphCalendarEventClientReceive>(
                `/apim/office365/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
                undefined,
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleOffice365Error(error);
        }
    }

    /**
     * Deletes a calendar event (V2).
     * @param calendarId The calendar ID (default: 'Calendar').
     * @param eventId The event ID to delete.
     * @param cancellationToken Optional cancellation token.
     */
    public async calendarDeleteItemV2Async(
        calendarId: string,
        eventId: string,
        cancellationToken?: AbortSignal
    ): Promise<void> {
        try {
            await this.deleteAsync(
                `/apim/office365/v2/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
                undefined,
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleOffice365Error(error);
        }
    }

    /**
     * Handles Office 365 connector errors and wraps them appropriately.
     * @param error The error to handle.
     */
    private handleOffice365Error(error: any): Office365ConnectorException {
        if (error instanceof Office365ConnectorException) {
            return error;
        }

        const message = error.message ?? 'Unknown Office 365 connector error';
        const statusCode = error.statusCode ?? 0;
        const statusText = error.statusText ?? '';
        const responseBody = error.responseBody;

        return new Office365ConnectorException(message, statusCode, statusText, responseBody);
    }
}