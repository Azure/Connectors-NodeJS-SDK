// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    CommondataserviceClient,
    Item,
    ItemsList,
} from "../src/generated/CommondataserviceExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import type { TokenCredential } from "../src/azureConnectors/index.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/commondataservice/abc123";

function createMockCredential(): TokenCredential {
    return {
        getToken: async () => ({
            token: "mock-bearer-token",
            expiresOnTimestamp: Number.MAX_SAFE_INTEGER,
        }),
    };
}

function createFetchResponse(body: ItemsList): Response {
    return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(body),
        headers: new Headers(),
    } as Response;
}

function createErrorResponse(status: number, body: string): Response {
    return {
        ok: false,
        status,
        text: async () => body,
        headers: new Headers(),
    } as Response;
}

describe("CommondataserviceClient — getItemsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should return items from every page and request the absolute same-host next link", async () => {
        const firstItem: Item = { dynamicProperties: { accountid: "account-1" } };
        const secondItem: Item = { dynamicProperties: { accountid: "account-2" } };
        const nextLink = `${TestConnectionUrl}/v2/datasets/default/tables/accounts/items?$skiptoken=page-2`;
        global.fetch = jest.fn()
            .mockResolvedValueOnce(createFetchResponse({
                value: [firstItem],
                "@odata.nextLink": nextLink,
            }))
            .mockResolvedValueOnce(createFetchResponse({ value: [secondItem] }));

        const client = new CommondataserviceClient(TestConnectionUrl, createMockCredential());
        const items: Item[] = [];
        for await (const item of client.getItemsAsync("default", "accounts")) {
            items.push(item);
        }

        expect(items).toEqual([firstItem, secondItem]);
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect((global.fetch as jest.Mock).mock.calls[1][0]).toBe(nextLink);
    });

    it.each([
        ["?$skiptoken=page-2", `${TestConnectionUrl}/v2/datasets/default/tables/accounts/items?$skiptoken=page-2`],
        ["items?$skiptoken=page-2", `${TestConnectionUrl}/v2/datasets/default/tables/accounts/items?$skiptoken=page-2`],
    ])("should resolve relative continuation '%s' against the current page", async (nextLink, expectedUrl) => {
        const firstItem: Item = { dynamicProperties: { accountid: "account-1" } };
        const secondItem: Item = { dynamicProperties: { accountid: "account-2" } };
        global.fetch = jest.fn()
            .mockResolvedValueOnce(createFetchResponse({
                value: [firstItem],
                "@odata.nextLink": nextLink,
            }))
            .mockResolvedValueOnce(createFetchResponse({ value: [secondItem] }));

        const client = new CommondataserviceClient(TestConnectionUrl, createMockCredential());
        const items: Item[] = [];
        for await (const item of client.getItemsAsync("default", "accounts")) {
            items.push(item);
        }

        expect(items).toEqual([firstItem, secondItem]);
        expect((global.fetch as jest.Mock).mock.calls[1][0]).toBe(expectedUrl);
    });

    it("should double encode Dataverse dataset and table path parameters", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce(createFetchResponse({ value: [] }));
        const client = new CommondataserviceClient(TestConnectionUrl, createMockCredential());
        const items: Item[] = [];

        for await (const item of client.getItemsAsync("https://contoso.crm.dynamics.com", "account/details")) {
            items.push(item);
        }

        expect(items).toEqual([]);
        expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
            `${TestConnectionUrl}/v2/datasets/https%253A%252F%252Fcontoso.crm.dynamics.com/` +
            "tables/account%252Fdetails/items",
        );
    });

    it("should reject with ConnectorException when a continuation page fails", async () => {
        const firstItem: Item = { dynamicProperties: { accountid: "account-1" } };
        const nextLink = `${TestConnectionUrl}/v2/datasets/default/tables/accounts/items?$skiptoken=page-2`;
        global.fetch = jest.fn()
            .mockResolvedValueOnce(createFetchResponse({
                value: [firstItem],
                "@odata.nextLink": nextLink,
            }))
            .mockResolvedValueOnce(createErrorResponse(503, "Service unavailable"));

        const client = new CommondataserviceClient(TestConnectionUrl, createMockCredential(), {
            retryOptions: { maxRetries: 0 },
        });
        const iterator = client.getItemsAsync("default", "accounts")[Symbol.asyncIterator]();

        await expect(iterator.next()).resolves.toEqual({ done: false, value: firstItem });
        await expect(iterator.next()).rejects.toMatchObject<Partial<ConnectorException>>({
            name: "ConnectorException",
            connectorName: "commondataservice",
            operation: `GET ${nextLink}`,
            statusCode: 503,
            responseBody: "Service unavailable",
        });
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });
});
