/**
 * @fileoverview Type definitions for Microsoft Teams connector
 */

import { ListResponse } from './commonTypes';

/**
 * Teams team information.
 */
export interface TeamsTeam {
    /**
     * The unique identifier of the team.
     */
    id?: string;

    /**
     * The display name of the team.
     */
    displayName?: string;

    /**
     * The description of the team.
     */
    description?: string;

    /**
     * The type of team (e.g., 'Private', 'Public').
     */
    teamType?: string;

    /**
     * The web URL of the team.
     */
    webUrl?: string;
}

/**
 * Response containing list of Teams teams.
 */
export interface TeamsTeamsResponse {
    /**
     * The list of teams.
     */
    teamsList?: TeamsTeam[];
}

/**
 * Teams channel information.
 */
export interface TeamsChannel {
    /**
     * The unique identifier of the channel.
     */
    channelID?: string;

    /**
     * The display name of the channel.
     */
    displayName?: string;

    /**
     * The description of the channel.
     */
    descriptionOfChannel?: string;

    /**
     * The type of the channel.
     */
    theTypeOfTheChannel?: string;

    /**
     * The web URL of the channel.
     */
    webUrl?: string;
}

/**
 * Response containing list of Teams channels.
 */
export interface TeamsChannelsResponse {
    /**
     * The list of channels.
     */
    channelList?: TeamsChannel[];
}

/**
 * Dynamic request for posting a message to Teams.
 */
export interface DynamicPostMessageRequest {
    /**
     * Additional properties for the message request.
     * This uses a dynamic schema that's determined at runtime.
     */
    additionalProperties?: Record<string, any>;
}

/**
 * Response from posting a message to Teams.
 */
export interface PostMessageResponse {
    /**
     * The unique identifier of the posted message.
     */
    messageID?: string;

    /**
     * The link to the posted message.
     */
    messageLink?: string;

    /**
     * The timestamp when the message was posted.
     */
    timestamp?: string;
}

/**
 * Teams message recipient information.
 */
export interface TeamsMessageRecipient {
    /**
     * The group/team ID.
     */
    groupId?: string;

    /**
     * The channel ID.
     */
    channelId?: string;

    /**
     * The user ID (for direct messages).
     */
    userId?: string;
}

/**
 * Teams message content.
 */
export interface TeamsMessageContent {
    /**
     * The message body (HTML format).
     */
    messageBody?: string;

    /**
     * The message subject (for certain message types).
     */
    subject?: string;

    /**
     * The importance of the message.
     */
    importance?: 'Low' | 'Normal' | 'High';
}

/**
 * Complete Teams message for posting.
 */
export interface TeamsMessage {
    /**
     * The recipient information.
     */
    recipient?: TeamsMessageRecipient;

    /**
     * The message content.
     */
    content?: TeamsMessageContent;

    /**
     * Additional message properties.
     */
    [key: string]: any;
}