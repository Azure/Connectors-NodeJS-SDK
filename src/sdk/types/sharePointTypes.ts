/**
 * @fileoverview Type definitions for SharePoint Online connector
 */

import { BlobMetadata, ListResponse } from './commonTypes';

/**
 * SharePoint table (list/library) definition.
 */
export interface SharePointTable {
    /**
     * The internal name of the table.
     */
    name?: string;

    /**
     * The display name of the table.
     */
    displayName?: string;

    /**
     * The description of the table.
     */
    description?: string;

    /**
     * The type of the table (e.g., 'List', 'DocumentLibrary').
     */
    tableType?: string;

    /**
     * The URL of the table.
     */
    url?: string;
}

/**
 * Response containing SharePoint tables.
 */
export interface SharePointTablesResponse extends ListResponse<SharePointTable> {
}

/**
 * SharePoint file/folder metadata, extending common blob metadata.
 */
export interface SharePointBlobMetadata extends BlobMetadata {
    /**
     * The SharePoint-specific file identifier.
     */
    sharepointId?: string;

    /**
     * The version of the file.
     */
    version?: string;

    /**
     * The author of the file.
     */
    author?: string;

    /**
     * The editor of the file.
     */
    editor?: string;

    /**
     * Check-out information.
     */
    checkOutType?: string;

    /**
     * The content type of the file.
     */
    contentType?: string;
}

/**
 * Request for creating/uploading a file to SharePoint.
 */
export interface CreateFileRequest {
    /**
     * The SharePoint site address.
     */
    site?: string;

    /**
     * The folder path where the file should be created.
     */
    folderPath?: string;

    /**
     * The name of the file to create.
     */
    fileName?: string;

    /**
     * The content of the file (base64 encoded for binary files).
     */
    content?: string;

    /**
     * Whether to overwrite if file exists.
     */
    overwrite?: boolean;
}

/**
 * Request for updating file content in SharePoint.
 */
export interface UpdateFileRequest {
    /**
     * The SharePoint site address.
     */
    site?: string;

    /**
     * The file path to update.
     */
    filePath?: string;

    /**
     * The new content of the file.
     */
    content?: string;
}

/**
 * SharePoint list item definition.
 */
export interface SharePointListItem {
    /**
     * The unique identifier of the item.
     */
    id?: string;

    /**
     * The title of the item.
     */
    title?: string;

    /**
     * Dynamic properties of the list item.
     */
    [key: string]: any;
}

/**
 * Request for creating a SharePoint list item.
 */
export interface CreateListItemRequest {
    /**
     * The SharePoint site address.
     */
    site?: string;

    /**
     * The name of the list.
     */
    listName?: string;

    /**
     * The properties of the item to create.
     */
    item?: Record<string, any>;
}

/**
 * Response containing SharePoint list items.
 */
export interface SharePointListItemsResponse extends ListResponse<SharePointListItem> {
}