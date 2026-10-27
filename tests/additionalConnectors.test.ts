// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import type { ConnectorClientBase, ConnectorPagedAsyncIterableIterator } from "../src/azureConnectors/clientBase.ts";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import type { ConnectorClientOptions } from "../src/azureConnectors/options.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import * as Generated from "../src/generated/index.ts";
import {
    availableConnectors,
    AzureadClient,
    AzureautomationClient,
    AzuredatafactoryClient,
    AzuredigitaltwinsClient,
    AzurequeuesClient,
    AzuretablesClient,
    AzurevmClient,
    CloudconvertClient,
    DataflowsClient,
    DocumentdbClient,
    EventhubsClient,
    ExcelonlinebusinessClient,
    KeyvaultClient,
    MicrosoftbookingsClient,
    Office365groupsClient,
    OnenoteClient,
    OutlookClient,
    PlannerClient,
    ServicebusClient,
    TrelloClient,
    VisualstudioteamservicesClient,
    WdatpClient,
    WordonlinebusinessClient,
    YammerClient,
} from "../src/generated/ManagedConnectors.ts";

const ConnectionUrl = "https://connection-runtime.azure.com/apim/test/connection";
const Credential: TokenCredential = {
    getToken: async () => ({ token: "mock-token", expiresOnTimestamp: Number.MAX_SAFE_INTEGER }),
};

interface ConnectorCase {
    apiName: string;
    clientName: string;
    createClient: () => ConnectorClientBase;
    invoke: () => Promise<unknown>;
    httpMethod: string;
}

function connectorCase<TClient extends ConnectorClientBase>(
    apiName: string,
    Client: new (url: string, credential: TokenCredential, options?: ConnectorClientOptions) => TClient,
    invoke: (client: TClient) => Promise<unknown>,
    httpMethod = "GET",
): ConnectorCase {
    const createClient = (): TClient => new Client(ConnectionUrl, Credential, { retryOptions: { maxRetries: 0 } });
    return {
        apiName,
        clientName: Client.name,
        createClient,
        invoke: async () => await invoke(createClient()),
        httpMethod,
    };
}

async function firstPage<TItem>(iterator: ConnectorPagedAsyncIterableIterator<TItem>): Promise<TItem[] | undefined> {
    return (await iterator.byPage().next()).value;
}

const ConnectorCases: ConnectorCase[] = [
    connectorCase("azuread", AzureadClient, async client => await client.getUser("user-id")),
    connectorCase("azureautomation", AzureautomationClient, async client =>
        await client.getStatusOfJob("subscription", "resource-group", "account", "job", "2015-10-31")),
    connectorCase("azuredatafactory", AzuredatafactoryClient, async client =>
        await client.getPipelineRun("subscription", "resource-group", "factory", "run", "2018-06-01")),
    connectorCase("azuredigitaltwins", AzuredigitaltwinsClient, async client =>
        await client.getModelById("model-id", "2020-10-31")),
    connectorCase("azurequeues", AzurequeuesClient, async client => await client.getMessages("account", "queue")),
    connectorCase("azuretables", AzuretablesClient, async client => await firstPage(client.getEntities("account", "table"))),
    connectorCase("azurevm", AzurevmClient, async client =>
        await client.getVirtualMachineInScaleSet("subscription", "resource-group", "scale-set", "instance", "2019-07-01")),
    connectorCase("cloudconvert", CloudconvertClient, async client =>
        await client.captureWebsite({ tasks: { capture: { operation: "capture-website", url: "https://example.com" } } }, "application/json"), "POST"),
    connectorCase("dataflows", DataflowsClient, async client =>
        await client.refreshDataflow("group-id", "dataflow-id", "Workspace"), "POST"),
    connectorCase("documentdb", DocumentdbClient, async client =>
        await client.getDocument("account", "database", "collection", "document")),
    connectorCase("eventhubs", EventhubsClient, async client =>
        await client.sendEvent({ ContentData: "aGVsbG8=" }, "event-hub"), "POST"),
    connectorCase("excelonlinebusiness", ExcelonlinebusinessClient, async client =>
        await firstPage(client.getItems("drive", "file", "table", "source"))),
    connectorCase("keyvault", KeyvaultClient, async client => await client.getKeyMetadata("key-name")),
    connectorCase("microsoftbookings", MicrosoftbookingsClient, async client =>
        await firstPage(client.listBookingsBusinessUserAsAdmin("outlook.body-content-type=\"text\""))),
    connectorCase("office365groups", Office365groupsClient, async client => await firstPage(client.listGroupMembers("group-id"))),
    connectorCase("onenote", OnenoteClient, async client => await client.getPageContent("notebook", "section", "page", false)),
    connectorCase("outlook", OutlookClient, async client => await client.getEmail("message-id")),
    connectorCase("planner", PlannerClient, async client => await client.getPlanDetails("plan-id")),
    connectorCase("servicebus", ServicebusClient, async client => await client.getDeferredMessageFromQueue("queue", 1)),
    connectorCase("trello", TrelloClient, async client => await client.getCard("card-id", "board-id")),
    connectorCase("visualstudioteamservices", VisualstudioteamservicesClient, async client =>
        await client.getBuild("project", 1, "account")),
    connectorCase("wdatp", WdatpClient, async client => await client.getSingleAlert("alert-id")),
    connectorCase("wordonlinebusiness", WordonlinebusinessClient, async client =>
        await client.getFilePDF("source", "drive", "file", "pdf")),
    connectorCase("yammer", YammerClient, async client => await client.getUserDetailsById(1)),
];

describe("Additional generated connector clients", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each(ConnectorCases)("should construct and export $apiName consistently", connector => {
        const client = connector.createClient();
        expect(client.connectorName).toBe(connector.apiName);
        expect(availableConnectors).toContain(connector.apiName);
        expect(Object.values(ConnectorNames)).toContain(connector.apiName);
        expect(Reflect.get(Generated, connector.clientName)).toBe(client.constructor);
    });

    it.each(ConnectorCases)("should send an authenticated $apiName request", async connector => {
        const body = connector.apiName === "onenote"
            ? "page content"
            : connector.apiName === "microsoftbookings"
                ? { mailboxes: [{ id: "item-id" }] }
                : { value: [{ id: "item-id" }], id: "item-id" };
        const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(
            new Response(JSON.stringify(body), { status: 200 }),
        );

        const response = await connector.invoke();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [requestUrl, request] = fetchMock.mock.calls[0];
        expect(String(requestUrl)).toMatch(new RegExp(`^${ConnectionUrl}`));
        expect(request?.method).toBe(connector.httpMethod);
        expect(new Headers(request?.headers).get("Authorization")).toBeTruthy();
        if (connector.apiName === "eventhubs") {
            expect(response).toBeUndefined();
        } else if (["cloudconvert", "wordonlinebusiness"].includes(connector.apiName)) {
            if (!(response instanceof Blob)) {
                throw new Error(`Expected '${connector.apiName}' to return binary content.`);
            }
            expect(await response.text()).toBe(JSON.stringify(body));
        } else if (["azuretables", "excelonlinebusiness", "microsoftbookings", "office365groups"].includes(connector.apiName)) {
            expect(response).toEqual([{ id: "item-id" }]);
        } else {
            expect(response).toEqual(body);
        }
    });

    it.each(ConnectorCases)("should propagate $apiName service errors", async connector => {
        jest.spyOn(global, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ error: { code: "NotFound", message: "Resource not found." } }), { status: 404 }),
        );

        const operation = connector.invoke();
        await expect(operation).rejects.toBeInstanceOf(ConnectorError);
        await expect(operation).rejects.toMatchObject({
            name: "ConnectorError",
            connectorName: connector.apiName,
            statusCode: 404,
            responseBody: JSON.stringify({ error: { code: "NotFound", message: "Resource not found." } }),
        });
    });

    it("should send the typed Event Hubs payload without renaming wire properties", async () => {
        const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
        const client = new EventhubsClient(ConnectionUrl, Credential);
        await client.sendEvent({ ContentData: "aGVsbG8=" }, "event hub", { partitionKey: "partition" });

        const [requestUrl, request] = fetchMock.mock.calls[0];
        expect(String(requestUrl)).toContain("event%20hub");
        expect(JSON.parse(String(request?.body))).toEqual({ ContentData: "aGVsbG8=" });
    });

    it.each([
        { initialItems: [] },
        { initialItems: [{ id: "first-model" }] },
    ])("should follow Digital Twins continuation after initial items $initialItems", async ({ initialItems }) => {
        const nextLink = `${ConnectionUrl}/models?continuationToken=second-page`;
        const fetchMock = jest.spyOn(global, "fetch")
            .mockResolvedValueOnce(new Response(JSON.stringify({ value: initialItems, nextLink }), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ value: [{ id: "later-model" }] }), { status: 200 }));
        const client = new AzuredigitaltwinsClient(ConnectionUrl, Credential);
        const iterator = client.listModels("2020-10-31");
        expect(fetchMock).not.toHaveBeenCalled();

        const models = [];
        for await (const model of iterator) {
            models.push(model);
        }

        expect(models).toEqual([...initialItems, { id: "later-model" }]);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(String(fetchMock.mock.calls[0][0])).toBe(`${ConnectionUrl}/models?api-version=2020-10-31`);
        expect(String(fetchMock.mock.calls[1][0])).toBe(nextLink);
        expect(await iterator.next()).toEqual({ value: undefined, done: true });
    });
});
