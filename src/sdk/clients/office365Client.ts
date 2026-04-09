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
    Office365OnNewEmailV3TriggerPayload
} from '../types/office365Types';

/**
 * Client for Office 365 Outlook connector operations.
 */
export class Office365Client extends ConnectorClientBase {
    /**
     * Initializes a new instance of the Office365Client class.
     * @param tokenProvider The token provider for authentication.
     * @param options The connector client options.
     */
    constructor(tokenProvider: ITokenProvider, options?: ConnectorClientOptions) {
        super(tokenProvider, options);
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
            await this.callConnectorAsync(
                'POST',
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
            const response = await this.callConnectorAsync<{ value: string[] }>(
                'GET',
                '/apim/office365/v2/MailCategories',
                undefined,
                undefined,
                { signal: cancellationToken }
            );
            return response.data.value ?? [];
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
            const response = await this.callConnectorAsync<GraphCalendarEventClientReceive>(
                'POST',
                `/apim/office365/v4/calendars/${encodeURIComponent(calendarId)}/events`,
                eventData,
                { 'Content-Type': 'application/json' },
                { signal: cancellationToken }
            );
            return response.data;
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
            const response = await this.callConnectorAsync<GraphCalendarEventListClientReceive>(
                'GET',
                `/apim/office365/v4/calendars/${encodeURIComponent(calendarId)}/events`,
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
            const response = await this.callConnectorAsync<any>(
                'GET',
                `/apim/office365/v2/Mail${queryParams}`,
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
     * Marks an email as read.
     * @param messageId The message ID to mark as read.
     * @param cancellationToken Optional cancellation token.
     */
    public async markEmailAsReadAsync(
        messageId: string,
        cancellationToken?: AbortSignal
    ): Promise<void> {
        try {
            await this.callConnectorAsync(
                'PATCH',
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
            const response = await this.callConnectorAsync<any>(
                'GET',
                '/apim/office365/v2/Me',
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