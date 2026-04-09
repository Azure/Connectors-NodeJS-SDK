/**
 * @fileoverview Connector names and related constants
 */

/**
 * Constants for connector names used throughout the SDK.
 */
export class ConnectorNames {
    /**
     * Office 365 Outlook connector name.
     */
    public static readonly Office365 = 'office365';

    /**
     * SharePoint Online connector name.
     */
    public static readonly SharePointOnline = 'sharepointonline';

    /**
     * Microsoft Teams connector name.
     */
    public static readonly Teams = 'teams';
}

/**
 * Operation names for Office 365 triggers.
 */
export class Office365TriggerOperations {
    /**
     * Trigger operation for when a new email arrives (V3).
     */
    public static readonly OnNewEmailV3 = 'OnNewEmailV3';

    /**
     * Trigger operation for when a calendar event is starting soon (V3).
     */
    public static readonly OnUpcomingEventV3 = 'OnUpcomingEventV3';
}