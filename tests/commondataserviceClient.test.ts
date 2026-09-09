// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    CommondataserviceClient,
    Item,
    ItemsList,
} from "../src/generated/CommondataserviceExtensions.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/commondataservice/abc123";

function createMockTokenProvider(): TokenProvider {
    return {
        getAccessTokenAsync: async () => "mock-bearer-token",
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

        const client = new CommondataserviceClient(TestConnectionUrl, createMockTokenProvider());
        const items: Item[] = [];
        for await (const item of client.getItemsAsync("default", "accounts")) {
            items.push(item);
        }

        expect(items).toEqual([firstItem, secondItem]);
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect((global.fetch as jest.Mock).mock.calls[1][0]).toBe(nextLink);
    });
});
