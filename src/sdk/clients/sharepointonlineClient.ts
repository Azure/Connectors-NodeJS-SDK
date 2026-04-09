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
     * @param connectionRuntimeUrl The connection runtime URL for the SharePoint Online connector endpoint.
     * @param tokenProvider The token provider for authentication.
     * @param options The connector client options.
     */
    constructor(connectionRuntimeUrl: string | undefined, tokenProvider: ITokenProvider, options?: ConnectorClientOptions) {
        super(connectionRuntimeUrl, tokenProvider, options);
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
            return await this.getAsync<SharePointTablesResponse>(
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/tables`,
                undefined,
                { signal: cancellationToken }
            );
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
            const result = await this.getAsync<{ value: BlobMetadata[] }>(
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/files`,
                undefined,
                { signal: cancellationToken }
            );
            return result.value ?? [];
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
            const result = await this.getAsync<{ value: BlobMetadata[] }>(
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/folders/${encodeURIComponent(folderId)}/files`,
                undefined,
                { signal: cancellationToken }
            );
            return result.value ?? [];
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
            return await this.postAsync<SharePointBlobMetadata>(
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/files/folders/${encodeURIComponent(folderPath)}/files`,
                fileContent,
                { 
                    'Content-Type': 'application/octet-stream',
                    'x-ms-file-name': fileName
                },
                { signal: cancellationToken }
            );
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
            return await this.putAsync<SharePointBlobMetadata>(
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/files/getfilecontentbypath(path='${encodeURIComponent(filePath)}')/content`,
                fileContent,
                { 'Content-Type': 'application/octet-stream' },
                { signal: cancellationToken }
            );
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
            await this.deleteAsync(
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/files/getfilecontentbypath(path='${encodeURIComponent(filePath)}')`,
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
            return await this.getAsync<SharePointListItemsResponse>(
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/tables/${encodeURIComponent(listName)}/items`,
                undefined,
                { signal: cancellationToken }
            );
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
            return await this.postAsync<any>(
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/tables/${encodeURIComponent(listName)}/items`,
                item,
                { 'Content-Type': 'application/json' },
                { signal: cancellationToken }
            );
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
            return await this.patchAsync<any>(
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/tables/${encodeURIComponent(listName)}/items/${encodeURIComponent(itemId)}`,
                item,
                { 'Content-Type': 'application/json' },
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleSharePointError(error);
        }
    }

    /**
     * Gets all datasets (site collections) available.
     * @param cancellationToken Optional cancellation token.
     */
    public async getDatasetsAsync(
        cancellationToken?: AbortSignal
    ): Promise<any> {
        try {
            return await this.getAsync<any>(
                '/apim/sharepointonline/datasets',
                undefined,
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleSharePointError(error);
        }
    }

    /**
     * Gets a specific item from a SharePoint list by ID.
     * @param siteAddress The SharePoint site address.
     * @param listName The name of the list.
     * @param itemId The ID of the item.
     * @param cancellationToken Optional cancellation token.
     */
    public async getItemAsync(
        siteAddress: string,
        listName: string,
        itemId: string,
        cancellationToken?: AbortSignal
    ): Promise<any> {
        try {
            return await this.getAsync<any>(
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/tables/${encodeURIComponent(listName)}/items/${encodeURIComponent(itemId)}`,
                undefined,
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleSharePointError(error);
        }
    }

    /**
     * Gets items from a SharePoint list with OData query options.
     * @param siteAddress The SharePoint site address.
     * @param listName The name of the list.
     * @param filter Optional OData filter expression.
     * @param top Optional number of items to retrieve.
     * @param orderBy Optional OData orderBy expression.
     * @param cancellationToken Optional cancellation token.
     */
    public async getItemsAsync(
        siteAddress: string,
        listName: string,
        filter?: string,
        top?: number,
        orderBy?: string,
        cancellationToken?: AbortSignal
    ): Promise<SharePointListItemsResponse> {
        try {
            const queryParams: string[] = [];
            if (filter) queryParams.push(`$filter=${encodeURIComponent(filter)}`);
            if (top !== undefined) queryParams.push(`$top=${top}`);
            if (orderBy) queryParams.push(`$orderby=${encodeURIComponent(orderBy)}`);
            const qs = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
            return await this.getAsync<SharePointListItemsResponse>(
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/tables/${encodeURIComponent(listName)}/items${qs}`,
                undefined,
                { signal: cancellationToken }
            );
        } catch (error) {
            throw this.handleSharePointError(error);
        }
    }

    /**
     * Creates a new item in a SharePoint list (alternative name for createListItemAsync).
     * @param siteAddress The SharePoint site address.
     * @param listName The name of the list.
     * @param item The item data to create.
     * @param cancellationToken Optional cancellation token.
     */
    public async postItemAsync(
        siteAddress: string,
        listName: string,
        item: Record<string, any>,
        cancellationToken?: AbortSignal
    ): Promise<any> {
        return await this.createListItemAsync(siteAddress, listName, item, cancellationToken);
    }

    /**
     * Deletes an item from a SharePoint list.
     * @param siteAddress The SharePoint site address.
     * @param listName The name of the list.
     * @param itemId The ID of the item to delete.
     * @param cancellationToken Optional cancellation token.
     */
    public async deleteItemAsync(
        siteAddress: string,
        listName: string,
        itemId: string,
        cancellationToken?: AbortSignal
    ): Promise<void> {
        try {
            await this.deleteAsync(
                `/apim/sharepointonline/datasets/${encodeURIComponent(siteAddress)}/tables/${encodeURIComponent(listName)}/items/${encodeURIComponent(itemId)}`,
                undefined,
                { signal: cancellationToken }
            );
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