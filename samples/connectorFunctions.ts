/**
 * @fileoverview Sample Azure Functions that use the generated connector clients from the TypeScript SDK
 * 
 * Demonstrates DI-based lifetime management, JSON handling for structured responses,
 * binary content (Buffer) download and upload, connector-specific exception handling,
 * and cancellation support.
 */

import { Context, HttpRequest, HttpResponseInit } from '@azure/functions';
import { Office365Client } from '../src/sdk/clients/office365Client';
import { SharepointonlineClient } from '../src/sdk/clients/sharepointonlineClient';
import { TeamsClient } from '../src/sdk/clients/teamsClient';
import { MsalTokenProvider } from '../src/sdk/authentication/msalTokenProvider';
import { ConnectorClientOptions } from '../src/sdk/base/connectorClientOptions';
import {
    Office365ConnectorException,
    SharepointonlineConnectorException,
    TeamsConnectorException,
    ExceptionExtensions
} from '../src/sdk/utils/exceptions';
import {
    ClientSendHtmlMessage,
    GraphCalendarEventClient,
    Office365OnNewEmailV3TriggerPayload
} from '../src/sdk/types/office365Types';
import { DynamicPostMessageRequest } from '../src/sdk/types/teamsTypes';

/**
 * Maximum accepted request body size for trigger callbacks (1 MB).
 * Requests exceeding this size are rejected with 200 OK to avoid AI Gateway retries.
 */
const MAX_TRIGGER_CALLBACK_BODY_SIZE = 1 * 1024 * 1024;

/**
 * Teams connector API path template for posting messages.
 * Parameters: {0} = poster (e.g., "Flow bot"), {1} = location (e.g., "Channel").
 */
const TEAMS_POST_MESSAGE_PATH_TEMPLATE = '/beta/teams/conversation/message/poster/{0}/location/{1}';

/**
 * Default poster identity for Teams messages posted via the connector.
 */
const TEAMS_DEFAULT_POSTER = 'Flow bot';

/**
 * Default message location for Teams channel posts.
 */
const TEAMS_DEFAULT_LOCATION = 'Channel';

/**
 * Configuration for the connector clients.
 */
class ConnectorFunctionsConfig {
    public static readonly tokenProviderConfig = {
        tenantId: process.env.AZURE_TENANT_ID || '',
        clientId: process.env.AZURE_CLIENT_ID || '',
        clientSecret: process.env.AZURE_CLIENT_SECRET || '',
        defaultScopes: ['https://graph.microsoft.com/.default']
    };

    public static readonly clientOptions = new ConnectorClientOptions({
        enableLogging: process.env.NODE_ENV !== 'production',
        timeout: 30000,
        maxRetryAttempts: 3
    });
}

/**
 * Azure Functions that use the generated connector clients from the TypeScript SDK.
 */
export class ConnectorFunctions {
    private readonly _office365Client: Office365Client;
    private readonly _sharePointClient: SharepointonlineClient;
    private readonly _teamsClient: TeamsClient;

    /**
     * Initializes a new instance of the ConnectorFunctions class.
     */
    constructor() {
        const tokenProvider = new MsalTokenProvider(ConnectorFunctionsConfig.tokenProviderConfig);
        const options = ConnectorFunctionsConfig.clientOptions;

        this._office365Client = new Office365Client(tokenProvider, options);
        this._sharePointClient = new SharepointonlineClient(tokenProvider, options);
        this._teamsClient = new TeamsClient(tokenProvider, options);
    }

    /**
     * Sends an email using the generated Office365Client.
     */
    public async sendEmail(request: HttpRequest, context: Context): Promise<HttpResponseInit> {
        context.log('SendEmail: Using generated Office365Client from SDK.');

        try {
            const body = await request.text();
            let input: SendEmailRequest;

            try {
                input = JSON.parse(body) as SendEmailRequest;
            } catch (error) {
                context.log.error('Invalid JSON in request body:', error);
                return {
                    status: 400,
                    jsonBody: { error: 'Request body must contain valid JSON.' }
                };
            }

            if (!input || !input.to) {
                return {
                    status: 400,
                    jsonBody: { error: "Invalid request body - 'to' is required." }
                };
            }

            const emailMessage: ClientSendHtmlMessage = {
                to: input.to,
                subject: input.subject || 'No Subject',
                body: input.body || ''
            };

            await this._office365Client.sendEmailV2Async(emailMessage);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    message: 'Email sent via generated Office365Client from SDK.',
                    to: input.to,
                    subject: input.subject,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            if (error instanceof Office365ConnectorException) {
                context.log.error('Connector error:', error.statusCode, error);
                return {
                    status: 502,
                    jsonBody: {
                        success: false,
                        error: error.message,
                        statusCode: error.statusCode,
                        details: error.responseBody
                    }
                };
            } else if (!ExceptionExtensions.isFatal(error)) {
                context.log.error('Error in SendEmail:', error);
                return {
                    status: 500,
                    jsonBody: {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
            throw error;
        }
    }

    /**
     * Gets Outlook categories using the generated Office365Client.
     */
    public async getCategories(request: HttpRequest, context: Context): Promise<HttpResponseInit> {
        context.log('GetCategories: Using generated Office365Client from SDK.');

        try {
            const categories = await this._office365Client.getOutlookCategoryNamesAsync();

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    count: categories?.length ?? 0,
                    categories: categories
                }
            };
        } catch (error) {
            if (error instanceof Office365ConnectorException) {
                context.log.error('Connector error:', error.statusCode, error);
                return {
                    status: 502,
                    jsonBody: {
                        success: false,
                        error: error.message,
                        statusCode: error.statusCode
                    }
                };
            } else if (!ExceptionExtensions.isFatal(error)) {
                context.log.error('Error in GetCategories:', error);
                return {
                    status: 500,
                    jsonBody: {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
            throw error;
        }
    }

    /**
     * Gets all SharePoint lists and libraries for a site using the generated SharepointonlineClient.
     */
    public async getSharePointLists(request: HttpRequest, context: Context): Promise<HttpResponseInit> {
        context.log('GetSharePointLists: Using generated SharepointonlineClient from SDK.');

        const url = new URL(request.url);
        const siteAddress = url.searchParams.get('site');

        if (!siteAddress) {
            return {
                status: 400,
                jsonBody: { error: "Query parameter 'site' is required." }
            };
        }

        try {
            const tables = await this._sharePointClient.getAllTablesAsync(siteAddress);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    site: siteAddress,
                    count: tables.value?.length ?? 0,
                    lists: tables.value?.map(table => ({
                        name: table.name,
                        displayName: table.displayName
                    }))
                }
            };
        } catch (error) {
            if (error instanceof SharepointonlineConnectorException) {
                context.log.error('SharePoint connector error:', error.statusCode, error);
                return {
                    status: 502,
                    jsonBody: {
                        success: false,
                        error: error.message,
                        statusCode: error.statusCode,
                        details: error.responseBody
                    }
                };
            } else if (!ExceptionExtensions.isFatal(error)) {
                context.log.error('Error in GetSharePointLists:', error);
                return {
                    status: 500,
                    jsonBody: {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
            throw error;
        }
    }

    /**
     * Lists files in a SharePoint folder using the generated SharepointonlineClient.
     */
    public async listFolder(request: HttpRequest, context: Context): Promise<HttpResponseInit> {
        context.log('ListFolder: Using generated SharepointonlineClient from SDK.');

        const url = new URL(request.url);
        const siteAddress = url.searchParams.get('site');

        if (!siteAddress) {
            return {
                status: 400,
                jsonBody: { error: "Query parameter 'site' is required." }
            };
        }

        try {
            const folderId = url.searchParams.get('folder');

            // NOTE: listRootFolderAsync vs listFolderAsync demonstrates
            // two overloads with the same return type but different parameter sets.
            const files = !folderId
                ? await this._sharePointClient.listRootFolderAsync(siteAddress)
                : await this._sharePointClient.listFolderAsync(siteAddress, folderId);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    site: siteAddress,
                    folder: !folderId ? '(root)' : folderId,
                    count: files?.length ?? 0,
                    files: (files ?? []).map(file => ({
                        id: file.id,
                        name: file.name,
                        displayName: file.displayName,
                        path: file.path,
                        size: file.size,
                        mediaType: file.mediaType,
                        isFolder: file.isFolder
                    }))
                }
            };
        } catch (error) {
            if (error instanceof SharepointonlineConnectorException) {
                context.log.error('SharePoint connector error:', error.statusCode, error);
                return {
                    status: 502,
                    jsonBody: {
                        success: false,
                        error: error.message,
                        statusCode: error.statusCode,
                        details: error.responseBody
                    }
                };
            } else if (!ExceptionExtensions.isFatal(error)) {
                context.log.error('Error in ListFolder:', error);
                return {
                    status: 500,
                    jsonBody: {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
            throw error;
        }
    }

    /**
     * Downloads file content from SharePoint as binary bytes.
     */
    public async downloadFile(request: HttpRequest, context: Context): Promise<HttpResponseInit> {
        context.log('DownloadFile: Using generated SharepointonlineClient Buffer response path.');

        const url = new URL(request.url);
        const siteAddress = url.searchParams.get('site');
        const filePath = url.searchParams.get('path');

        if (!siteAddress || !filePath) {
            return {
                status: 400,
                jsonBody: { error: "Query parameters 'site' and 'path' are required." }
            };
        }

        try {
            // NOTE: This exercises the Buffer return path in the generated client.
            const fileBytes = await this._sharePointClient.getFileContentByPathAsync(siteAddress, filePath);

            // NOTE: Sanitize the filename to prevent response header injection.
            const fileName = filePath.split('/').pop()?.replace(/[\r\n"]/g, '') || 'download';

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': `attachment; filename="${fileName}"`
                },
                body: fileBytes
            };
        } catch (error) {
            if (error instanceof SharepointonlineConnectorException) {
                context.log.error('SharePoint connector error:', error.statusCode, error);
                return {
                    status: 502,
                    jsonBody: {
                        success: false,
                        error: error.message,
                        statusCode: error.statusCode,
                        details: error.responseBody
                    }
                };
            } else if (!ExceptionExtensions.isFatal(error)) {
                context.log.error('Error in DownloadFile:', error);
                return {
                    status: 500,
                    jsonBody: {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
            throw error;
        }
    }

    /**
     * Uploads a file to a SharePoint document library.
     */
    public async uploadFile(request: HttpRequest, context: Context): Promise<HttpResponseInit> {
        context.log('UploadFile: Using generated SharepointonlineClient Buffer input path.');

        try {
            const body = await request.text();
            let input: UploadFileRequest;

            try {
                input = JSON.parse(body) as UploadFileRequest;
            } catch (error) {
                context.log.error('Invalid JSON in request body:', error);
                return {
                    status: 400,
                    jsonBody: { error: 'Request body must contain valid JSON.' }
                };
            }

            if (!input || !input.site || !input.folderPath || !input.fileName) {
                return {
                    status: 400,
                    jsonBody: { error: "Fields 'site', 'folderPath', and 'fileName' are required." }
                };
            }

            // NOTE: Support both base64-encoded binary and plain text content.
            let fileBytes: Buffer;
            try {
                fileBytes = input.contentBase64
                    ? Buffer.from(input.contentBase64, 'base64')
                    : Buffer.from(input.content || '', 'utf-8');
            } catch (error) {
                context.log.error('Invalid base64 content in contentBase64:', error);
                return {
                    status: 400,
                    jsonBody: { error: "The 'contentBase64' field must contain valid base64-encoded data." }
                };
            }

            const metadata = await this._sharePointClient.createFileAsync(
                input.site,
                fileBytes,
                input.folderPath,
                input.fileName
            );

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    message: `File '${input.fileName}' uploaded to '${input.folderPath}'.`,
                    fileId: metadata?.id,
                    name: metadata?.name,
                    path: metadata?.path,
                    size: fileBytes.length
                }
            };
        } catch (error) {
            if (error instanceof SharepointonlineConnectorException) {
                context.log.error('SharePoint connector error:', error.statusCode, error);
                return {
                    status: 502,
                    jsonBody: {
                        success: false,
                        error: error.message,
                        statusCode: error.statusCode,
                        details: error.responseBody
                    }
                };
            } else if (!ExceptionExtensions.isFatal(error)) {
                context.log.error('Error in UploadFile:', error);
                return {
                    status: 500,
                    jsonBody: {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
            throw error;
        }
    }

    /**
     * Exports an email message as raw RFC822 (.eml) bytes.
     */
    public async exportEmail(request: HttpRequest, context: Context): Promise<HttpResponseInit> {
        context.log('ExportEmail: Using generated Office365Client Buffer response path.');

        const url = new URL(request.url);
        const messageId = url.searchParams.get('messageId');

        if (!messageId) {
            return {
                status: 400,
                jsonBody: { error: "Query parameter 'messageId' is required." }
            };
        }

        try {
            // NOTE: This exercises the same Buffer return path as SharePoint's
            // getFileContentByPathAsync, proving the pattern works across connectors.
            const emailBytes = await this._office365Client.exportEmailV2Async(messageId);

            return {
                status: 200,
                headers: {
                    'Content-Type': 'message/rfc822',
                    'Content-Disposition': 'attachment; filename="exported-email.eml"'
                },
                body: emailBytes
            };
        } catch (error) {
            if (error instanceof Office365ConnectorException) {
                context.log.error('Connector error:', error.statusCode, error);
                return {
                    status: 502,
                    jsonBody: {
                        success: false,
                        error: error.message,
                        statusCode: error.statusCode
                    }
                };
            } else if (!ExceptionExtensions.isFatal(error)) {
                context.log.error('Error in ExportEmail:', error);
                return {
                    status: 500,
                    jsonBody: {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
            throw error;
        }
    }

    /**
     * Gets all Teams the signed-in user is a member of using the generated TeamsClient.
     */
    public async getAllTeams(request: HttpRequest, context: Context): Promise<HttpResponseInit> {
        context.log('GetAllTeams: Using generated TeamsClient from SDK.');

        try {
            const result = await this._teamsClient.getAllTeamsAsync();

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    count: result.teamsList?.length ?? 0,
                    teams: result.teamsList
                }
            };
        } catch (error) {
            if (error instanceof TeamsConnectorException) {
                context.log.error('Teams connector error:', error.statusCode, error);
                return {
                    status: 502,
                    jsonBody: {
                        success: false,
                        error: error.message,
                        statusCode: error.statusCode,
                        details: error.responseBody
                    }
                };
            } else if (!ExceptionExtensions.isFatal(error)) {
                context.log.error('Error in GetAllTeams:', error);
                return {
                    status: 500,
                    jsonBody: {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
            throw error;
        }
    }

    /**
     * Posts a message to a Teams channel using the generated TeamsClient.
     */
    public async postTeamsMessage(request: HttpRequest, context: Context): Promise<HttpResponseInit> {
        context.log('PostTeamsMessage: Using generated TeamsClient from SDK.');

        try {
            const body = await request.text();
            let input: PostTeamsMessageRequest;

            try {
                input = JSON.parse(body) as PostTeamsMessageRequest;
            } catch (error) {
                context.log.error('Invalid JSON in request body:', error);
                return {
                    status: 400,
                    jsonBody: { error: 'Request body must contain valid JSON.' }
                };
            }

            if (!input || !input.teamId || !input.channelId || !input.message) {
                return {
                    status: 400,
                    jsonBody: { error: "Fields 'teamId', 'channelId', and 'message' are required." }
                };
            }

            // NOTE: PostMessageToConversationAsync uses DynamicPostMessageRequest (dynamic schema).
            const messageRequest: DynamicPostMessageRequest = {
                additionalProperties: {
                    recipient: {
                        groupId: input.teamId,
                        channelId: input.channelId,
                    },
                    messageBody: `<p>${this.htmlEncode(input.message)}</p>`
                }
            };

            const result = await this._teamsClient.postMessageToConversationAsync(
                TEAMS_DEFAULT_POSTER,
                TEAMS_DEFAULT_LOCATION,
                messageRequest
            );

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    message: 'Message posted to Teams channel via generated TeamsClient from SDK.',
                    messageId: result.messageID,
                    messageLink: result.messageLink,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            if (error instanceof TeamsConnectorException) {
                context.log.error('Teams connector error:', error.statusCode, error);
                return {
                    status: 502,
                    jsonBody: {
                        success: false,
                        error: error.message,
                        statusCode: error.statusCode,
                        details: error.responseBody
                    }
                };
            } else if (!ExceptionExtensions.isFatal(error)) {
                context.log.error('Error in PostTeamsMessage:', error);
                return {
                    status: 500,
                    jsonBody: {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
            throw error;
        }
    }

    /**
     * Creates a calendar event using the generated Office365Client.
     */
    public async createCalendarEvent(request: HttpRequest, context: Context): Promise<HttpResponseInit> {
        context.log('CreateCalendarEvent: Using generated Office365Client from SDK.');

        try {
            const body = await request.text();
            let input: CreateCalendarEventRequest;

            try {
                input = JSON.parse(body) as CreateCalendarEventRequest;
            } catch (error) {
                context.log.error('Invalid JSON in request body:', error);
                return {
                    status: 400,
                    jsonBody: { error: 'Request body must contain valid JSON.' }
                };
            }

            if (!input || !input.subject || !input.startTime || !input.endTime) {
                return {
                    status: 400,
                    jsonBody: { error: "Fields 'subject', 'startTime', and 'endTime' are required." }
                };
            }

            const calendarEvent: GraphCalendarEventClient = {
                subject: input.subject,
                body: input.body || '',
                startTime: input.startTime,
                endTime: input.endTime,
                timeZone: input.timeZone || 'UTC',
                requiredAttendees: input.requiredAttendees
            };

            // NOTE: "Calendar" is the default calendar ID for the signed-in user.
            const calendarId = input.calendarId || 'Calendar';

            const result = await this._office365Client.v4CalendarPostItemAsync(calendarId, calendarEvent);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    message: 'Calendar event created via generated Office365Client from SDK.',
                    eventId: result.iCalUId,
                    subject: result.subject,
                    start: result.startTime,
                    end: result.endTime,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            if (error instanceof Office365ConnectorException) {
                context.log.error('Connector error:', error.statusCode, error);
                return {
                    status: 502,
                    jsonBody: {
                        success: false,
                        error: error.message,
                        statusCode: error.statusCode,
                        details: error.responseBody
                    }
                };
            } else if (!ExceptionExtensions.isFatal(error)) {
                context.log.error('Error in CreateCalendarEvent:', error);
                return {
                    status: 500,
                    jsonBody: {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            }
            throw error;
        }
    }

    /**
     * Disposes all clients and releases resources.
     */
    public async dispose(): Promise<void> {
        await Promise.all([
            this._office365Client.dispose(),
            this._sharePointClient.dispose(),
            this._teamsClient.dispose()
        ]);
    }

    /**
     * Simple HTML encoding for security.
     */
    private htmlEncode(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

// Request/Response type definitions
interface SendEmailRequest {
    to?: string;
    subject?: string;
    body?: string;
}

interface UploadFileRequest {
    site?: string;
    folderPath?: string;
    fileName?: string;
    content?: string;
    contentBase64?: string;
}

interface PostTeamsMessageRequest {
    teamId?: string;
    channelId?: string;
    message?: string;
}

interface CreateCalendarEventRequest {
    calendarId?: string;
    subject?: string;
    body?: string;
    startTime?: string;
    endTime?: string;
    timeZone?: string;
    requiredAttendees?: string;
}