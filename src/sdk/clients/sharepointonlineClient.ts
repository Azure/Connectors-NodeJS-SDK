/**
 * @fileoverview SharePoint Online connector client
 */

import { ConnectorClientBase } from '../base/connectorClientBase';
import { ConnectorClientOptions } from '../base/connectorClientOptions';
import { ITokenProvider } from '../authentication/tokenProvider';
import { ConnectorNames } from '../constants/connectorNames';
import { SharepointonlineConnectorException } from '../utils/exceptions';
import { BlobMetadata } from '../types/commonTypes';
import {
    SharePointTablesResponse,
    SharePointBlobMetadata,
    CreateFileRequest,
    UpdateFileRequest,
    SharePointListItemsResponse,
    CreateListItemRequest
} from '../types/sharePointTypes';

/**
 * Client for SharePoint Online connector operations.
 */
export class SharepointonlineClient extends ConnectorClientBase {
    /**
     * Initializes a new instance of the SharepointonlineClient class.
     * @param tokenProvider The token provider for authentication.
     * @param options The connector client options.
     */
    constructor(tokenProvider: ITokenProvider, options?: ConnectorClientOptions) {
        super(tokenProvider, options);
    }

    /**
     * Gets the connector name.
     */
    public readonly connectorName: string = ConnectorNames.SharePointOnline;

    /**
     * Gets all tables (lists and libraries) for a SharePoint site.
     * @param siteAddress The SharePoint site address.
     * @param cancellationToken Optional cancellation token.
     */
    public async getAllTablesAsync(
        siteAddress: string,
        cancellationToken?: AbortSignal
    ): Promise<SharePointTablesResponse> {
        try {
            const response = await this.callConnectorAsync<SharePointTablesResponse>(
                'GET',
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/tables`,
                undefined,
                undefined,
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleSharePointError(error);
        }
    }

    /**
     * Lists files in the root folder of a SharePoint site.
     * @param siteAddress The SharePoint site address.
     * @param cancellationToken Optional cancellation token.
     */
    public async listRootFolderAsync(
        siteAddress: string,
        cancellationToken?: AbortSignal
    ): Promise<BlobMetadata[]> {
        try {
            const response = await this.callConnectorAsync<{ value: BlobMetadata[] }>(
                'GET',
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/files`,
                undefined,
                undefined,
                { signal: cancellationToken }
            );
            return response.data.value ?? [];
        } catch (error) {
            throw this.handleSharePointError(error);
        }
    }

    /**
     * Lists files in a specific folder of a SharePoint site.
     * @param siteAddress The SharePoint site address.
     * @param folderId The folder identifier.
     * @param cancellationToken Optional cancellation token.
     */
    public async listFolderAsync(
        siteAddress: string,
        folderId: string,
        cancellationToken?: AbortSignal
    ): Promise<BlobMetadata[]> {
        try {
            const response = await this.callConnectorAsync<{ value: BlobMetadata[] }>(
                'GET',
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/folders/${encodeURIComponent(folderId)}/files`,
                undefined,
                undefined,
                { signal: cancellationToken }
            );
            return response.data.value ?? [];
        } catch (error) {
            throw this.handleSharePointError(error);
        }
    }

    /**
     * Gets file content by path as binary data.
     * @param siteAddress The SharePoint site address.
     * @param filePath The file path.
     * @param cancellationToken Optional cancellation token.
     */
    public async getFileContentByPathAsync(
        siteAddress: string,
        filePath: string,
        cancellationToken?: AbortSignal
    ): Promise<Buffer> {
        try {
            const response = await this.callConnectorBinaryAsync(
                'GET',
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/files/getfilecontentbypath(path='${encodeURIComponent(filePath)}')/content`,
                undefined,
                undefined,
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleSharePointError(error);
        }
    }

    /**
     * Creates a new file in SharePoint with binary content.
     * @param siteAddress The SharePoint site address.
     * @param fileContent The file content as a buffer.
     * @param folderPath The folder path where to create the file.
     * @param fileName The name of the file.
     * @param cancellationToken Optional cancellation token.
     */
    public async createFileAsync(
        siteAddress: string,
        fileContent: Buffer,
        folderPath: string,
        fileName: string,
        cancellationToken?: AbortSignal
    ): Promise<SharePointBlobMetadata> {
        try {
            const response = await this.callConnectorAsync<SharePointBlobMetadata>(
                'POST',
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/files/folders/${encodeURIComponent(folderPath)}/files`,
                fileContent,
                { 
                    'Content-Type': 'application/octet-stream',
                    'x-ms-file-name': fileName
                },
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleSharePointError(error);
        }
    }

    /**
     * Updates file content by path.
     * @param siteAddress The SharePoint site address.
     * @param filePath The file path.
     * @param fileContent The new file content.
     * @param cancellationToken Optional cancellation token.
     */
    public async updateFileByPathAsync(
        siteAddress: string,
        filePath: string,
        fileContent: Buffer,
        cancellationToken?: AbortSignal
    ): Promise<SharePointBlobMetadata> {
        try {
            const response = await this.callConnectorAsync<SharePointBlobMetadata>(
                'PUT',
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/files/getfilecontentbypath(path='${encodeURIComponent(filePath)}')/content`,
                fileContent,
                { 'Content-Type': 'application/octet-stream' },
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleSharePointError(error);
        }
    }

    /**
     * Deletes a file by path.
     * @param siteAddress The SharePoint site address.
     * @param filePath The file path.
     * @param cancellationToken Optional cancellation token.
     */
    public async deleteFileByPathAsync(
        siteAddress: string,
        filePath: string,
        cancellationToken?: AbortSignal
    ): Promise<void> {
        try {
            await this.callConnectorAsync(
                'DELETE',
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/files/getfilecontentbypath(path='${encodeURIComponent(filePath)}')`,
                undefined,
                undefined,
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleSharePointError(error);
        }
    }

    /**
     * Gets items from a SharePoint list.
     * @param siteAddress The SharePoint site address.
     * @param listName The name of the list.
     * @param cancellationToken Optional cancellation token.
     */
    public async getListItemsAsync(
        siteAddress: string,
        listName: string,
        cancellationToken?: AbortSignal
    ): Promise<SharePointListItemsResponse> {
        try {
            const response = await this.callConnectorAsync<SharePointListItemsResponse>(
                'GET',
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/tables/${encodeURIComponent(listName)}/items`,
                undefined,
                undefined,
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleSharePointError(error);
        }
    }

    /**
     * Creates a new item in a SharePoint list.
     * @param siteAddress The SharePoint site address.
     * @param listName The name of the list.
     * @param item The item data to create.
     * @param cancellationToken Optional cancellation token.
     */
    public async createListItemAsync(
        siteAddress: string,
        listName: string,
        item: Record<string, any>,
        cancellationToken?: AbortSignal
    ): Promise<any> {
        try {
            const response = await this.callConnectorAsync<any>(
                'POST',
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/tables/${encodeURIComponent(listName)}/items`,
                item,
                { 'Content-Type': 'application/json' },
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleSharePointError(error);
        }
    }

    /**
     * Updates an item in a SharePoint list.
     * @param siteAddress The SharePoint site address.
     * @param listName The name of the list.
     * @param itemId The ID of the item to update.
     * @param item The updated item data.
     * @param cancellationToken Optional cancellation token.
     */
    public async updateListItemAsync(
        siteAddress: string,
        listName: string,
        itemId: string,
        item: Record<string, any>,
        cancellationToken?: AbortSignal
    ): Promise<any> {
        try {
            const response = await this.callConnectorAsync<any>(
                'PATCH',
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/tables/${encodeURIComponent(listName)}/items/${encodeURIComponent(itemId)}`,
                item,
                { 'Content-Type': 'application/json' },
                { signal: cancellationToken }
            );
            return response.data;
        } catch (error) {
            throw this.handleSharePointError(error);
        }
    }

    /**
     * Handles SharePoint connector errors and wraps them appropriately.
     * @param error The error to handle.
     */
    private handleSharePointError(error: any): SharepointonlineConnectorException {
        if (error instanceof SharepointonlineConnectorException) {
            return error;
        }

        const message = error.message ?? 'Unknown SharePoint connector error';
        const statusCode = error.statusCode ?? 0;
        const statusText = error.statusText ?? '';
        const responseBody = error.responseBody;

        return new SharepointonlineConnectorException(message, statusCode, statusText, responseBody);
    }
}