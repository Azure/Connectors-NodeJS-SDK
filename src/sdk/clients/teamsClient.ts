/**
 * @fileoverview Microsoft Teams connector client
 */

import { ConnectorClientBase } from '../base/connectorClientBase';
import { ConnectorClientOptions } from '../base/connectorClientOptions';
import { ITokenProvider } from '../authentication/tokenProvider';
import { ConnectorNames } from '../constants/connectorNames';
import { TeamsConnectorException } from '../utils/exceptions';
import {
    TeamsTeamsResponse,
    TeamsChannelsResponse,
    DynamicPostMessageRequest,
    PostMessageResponse,
    TeamsMessage
} from '../types/teamsTypes';

/**
 * Client for Microsoft Teams connector operations.
 */
export class TeamsClient extends ConnectorClientBase {
    /**
     * Initializes a new instance of the TeamsClient class.
     * @param tokenProvider The token provider for authentication.
     * @param options The connector client options.
     */
    constructor(tokenProvider: ITokenProvider, options?: ConnectorClientOptions) {
        super(tokenProvider, options);
    }

    /**
     * Gets the connector name.
     */
    public readonly connectorName: string = ConnectorNames.Teams;

    /**
     * Gets all teams the signed-in user is a member of.
     * @param cancellationToken Optional cancellation token.
     */
    public async getAllTeamsAsync(cancellationToken?: AbortSignal): Promise<TeamsTeamsResponse> {
        try {
            const response = await this.callConnectorAsync<TeamsTeamsResponse>(
                'GET',
                '/apim/teams/v1.0/me/joinedTeams',
                undefined,
                undefined,
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleTeamsError(error);
        }
    }

    /**
     * Gets all channels for a specific team.
     * @param teamId The ID of the team.
     * @param cancellationToken Optional cancellation token.
     */
    public async getChannelsForGroupAsync(
        teamId: string,
        cancellationToken?: AbortSignal
    ): Promise<TeamsChannelsResponse> {
        try {
            const response = await this.callConnectorAsync<TeamsChannelsResponse>(
                'GET',
                `/apim/teams/v1.0/teams/${encodeURIComponent(teamId)}/channels`,
                undefined,
                undefined,
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleTeamsError(error);
        }
    }

    /**
     * Posts a message to a Teams conversation.
     * @param postAs The poster identity (e.g., "Flow bot").
     * @param postIn The location to post (e.g., "Channel").
     * @param input The message request with dynamic schema.
     * @param cancellationToken Optional cancellation token.
     */
    public async postMessageToConversationAsync(
        postAs: string,
        postIn: string,
        input: DynamicPostMessageRequest,
        cancellationToken?: AbortSignal
    ): Promise<PostMessageResponse> {
        try {
            const response = await this.callConnectorAsync<PostMessageResponse>(
                'POST',
                `/beta/teams/conversation/message/poster/${encodeURIComponent(postAs)}/location/${encodeURIComponent(postIn)}`,
                input.additionalProperties ?? input,
                { 'Content-Type': 'application/json' },
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleTeamsError(error);
        }
    }

    /**
     * Posts a simple message to a Teams channel.
     * @param teamId The ID of the team.
     * @param channelId The ID of the channel.
     * @param messageBody The message body in HTML format.
     * @param cancellationToken Optional cancellation token.
     */
    public async postMessageToChannelAsync(
        teamId: string,
        channelId: string,
        messageBody: string,
        cancellationToken?: AbortSignal
    ): Promise<PostMessageResponse> {
        const messageRequest: DynamicPostMessageRequest = {
            additionalProperties: {
                recipient: {
                    groupId: teamId,
                    channelId: channelId,
                },
                messageBody: messageBody
            }
        };

        return await this.postMessageToConversationAsync(
            'Flow bot',
            'Channel',
            messageRequest,
            cancellationToken
        );
    }

    /**
     * Gets team information by ID.
     * @param teamId The ID of the team.
     * @param cancellationToken Optional cancellation token.
     */
    public async getTeamAsync(teamId: string, cancellationToken?: AbortSignal): Promise<any> {
        try {
            const response = await this.callConnectorAsync<any>(
                'GET',
                `/apim/teams/v1.0/teams/${encodeURIComponent(teamId)}`,
                undefined,
                undefined,
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleTeamsError(error);
        }
    }

    /**
     * Gets channel information by ID.
     * @param teamId The ID of the team.
     * @param channelId The ID of the channel.
     * @param cancellationToken Optional cancellation token.
     */
    public async getChannelAsync(
        teamId: string,
        channelId: string,
        cancellationToken?: AbortSignal
    ): Promise<any> {
        try {
            const response = await this.callConnectorAsync<any>(
                'GET',
                `/apim/teams/v1.0/teams/${encodeURIComponent(teamId)}/channels/${encodeURIComponent(channelId)}`,
                undefined,
                undefined,
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleTeamsError(error);
        }
    }

    /**
     * Gets messages from a Teams channel.
     * @param teamId The ID of the team.
     * @param channelId The ID of the channel.
     * @param cancellationToken Optional cancellation token.
     */
    public async getChannelMessagesAsync(
        teamId: string,
        channelId: string,
        cancellationToken?: AbortSignal
    ): Promise<any> {
        try {
            const response = await this.callConnectorAsync<any>(
                'GET',
                `/apim/teams/v1.0/teams/${encodeURIComponent(teamId)}/channels/${encodeURIComponent(channelId)}/messages`,
                undefined,
                undefined,
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleTeamsError(error);
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
                '/apim/teams/v1.0/me',
                undefined,
                undefined,
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleTeamsError(error);
        }
    }

    /**
     * Gets the user's presence information.
     * @param cancellationToken Optional cancellation token.
     */
    public async getUserPresenceAsync(cancellationToken?: AbortSignal): Promise<any> {
        try {
            const response = await this.callConnectorAsync<any>(
                'GET',
                '/apim/teams/v1.0/me/presence',
                undefined,
                undefined,
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleTeamsError(error);
        }
    }

    /**
     * Handles Teams connector errors and wraps them appropriately.
     * @param error The error to handle.
     */
    private handleTeamsError(error: any): TeamsConnectorException {
        if (error instanceof TeamsConnectorException) {
            return error;
        }

        const message = error.message ?? 'Unknown Teams connector error';
        const statusCode = error.statusCode ?? 0;
        const statusText = error.statusText ?? '';
        const responseBody = error.responseBody;

        return new TeamsConnectorException(message, statusCode, statusText, responseBody);
    }
}