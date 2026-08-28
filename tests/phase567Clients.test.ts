// Copyright (c) Microsoft Corporation.  All rights reserved.

import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { ElfsquaddataClient } from "../src/generated/ElfsquaddataExtensions.ts";
import { EtsyClient } from "../src/generated/EtsyExtensions.ts";
import { EventbriteClient } from "../src/generated/EventbriteExtensions.ts";
import { FormstackformsClient } from "../src/generated/FormstackformsExtensions.ts";
import { ImpexiumClient } from "../src/generated/ImpexiumExtensions.ts";
import { JedoxodatahubClient } from "../src/generated/JedoxodatahubExtensions.ts";
import { MeetingroommapClient } from "../src/generated/MeetingroommapExtensions.ts";
import { OrderfulClient } from "../src/generated/OrderfulExtensions.ts";
import { PlivoClient } from "../src/generated/PlivoExtensions.ts";
import { RepliconClient } from "../src/generated/RepliconExtensions.ts";
import { RevaiClient } from "../src/generated/RevaiExtensions.ts";
import { SeismicplannerClient } from "../src/generated/SeismicplannerExtensions.ts";
import { StarmindClient } from "../src/generated/StarmindExtensions.ts";
import { Starrezrestv1Client } from "../src/generated/Starrezrestv1Extensions.ts";
import { TallyfyClient } from "../src/generated/TallyfyExtensions.ts";
import { TicketmasterClient } from "../src/generated/TicketmasterExtensions.ts";
import { TwitterClient } from "../src/generated/TwitterExtensions.ts";
import { TypeformClient, TypeformTriggerOperations } from "../src/generated/TypeformExtensions.ts";
import { WaywedoClient } from "../src/generated/WaywedoExtensions.ts";
import { WordpressClient } from "../src/generated/WordpressExtensions.ts";
import { ZohosignClient } from "../src/generated/ZohosignExtensions.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/test/abc123";

interface GeneratedConnectorClient {
    readonly connectorName: string;
}

type GeneratedConnectorClientConstructor = new (
    connectionRuntimeUrl: string,
    tokenProvider: TokenProvider,
) => GeneratedConnectorClient;

interface ConnectorCase {
    displayName: string;
    apiName: string;
    connectorNameKey: keyof typeof ConnectorNames;
    clientConstructor: GeneratedConnectorClientConstructor;
    methodName?: string;
    methodArguments?: unknown[];
}

const ConnectorCases: ConnectorCase[] = [
    { displayName: "Twitter", apiName: "twitter", connectorNameKey: "X", clientConstructor: TwitterClient, methodName: "homeTimelineAsync" },
    { displayName: "WordPress", apiName: "wordpress", connectorNameKey: "WordPress", clientConstructor: WordpressClient, methodName: "siteStatsAsync", methodArguments: ["site-id"] },
    { displayName: "Plivo", apiName: "plivo", connectorNameKey: "Plivo", clientConstructor: PlivoClient, methodName: "listMessagesAsync", methodArguments: ["auth-id"] },
    { displayName: "Rev.ai", apiName: "revai", connectorNameKey: "RevAIIndependentPublisher", clientConstructor: RevaiClient, methodName: "transcriptionsGetAsync" },
    { displayName: "Starmind", apiName: "starmind", connectorNameKey: "Starmind", clientConstructor: StarmindClient, methodName: "findQuestionsAsync" },
    { displayName: "Tallyfy", apiName: "tallyfy", connectorNameKey: "Tallyfy", clientConstructor: TallyfyClient, methodName: "getUserTasksAsync", methodArguments: ["organization", "user-id"] },
    { displayName: "Eventbrite", apiName: "eventbrite", connectorNameKey: "Eventbrite", clientConstructor: EventbriteClient, methodName: "createEventAsync", methodArguments: ["organization-id"] },
    { displayName: "Formstack Forms", apiName: "formstackforms", connectorNameKey: "FormstackForms", clientConstructor: FormstackformsClient, methodName: "getAvailableFormsAsync" },
    { displayName: "Typeform", apiName: "typeform", connectorNameKey: "Typeform", clientConstructor: TypeformClient },
    { displayName: "Ticketmaster", apiName: "ticketmaster", connectorNameKey: "TicketmasterIndependentPublisher", clientConstructor: TicketmasterClient, methodName: "eventGetAsync", methodArguments: ["event-id"] },
    { displayName: "Zoho Sign", apiName: "zohosign", connectorNameKey: "ZohoSign", clientConstructor: ZohosignClient, methodName: "downloadCompletionCertificateAsync", methodArguments: ["request-id"] },
    { displayName: "Seismic Planner", apiName: "seismicplanner", connectorNameKey: "SeismicPlanner", clientConstructor: SeismicplannerClient, methodName: "getCommentsAsync", methodArguments: ["space-id", "node-id"] },
    { displayName: "Way We Do", apiName: "waywedo", connectorNameKey: "WayWeDo", clientConstructor: WaywedoClient, methodName: "checklistInstancesGetAsync", methodArguments: ["instance-id"] },
    { displayName: "Meeting Room Map", apiName: "meetingroommap", connectorNameKey: "MeetingRoomMap", clientConstructor: MeetingroommapClient, methodName: "getCategoriesAsync" },
    { displayName: "StarRez REST V1", apiName: "starrezrestv1", connectorNameKey: "StarRezRESTV1", clientConstructor: Starrezrestv1Client, methodName: "selectEntryAsync", methodArguments: [{}] },
    { displayName: "Replicon", apiName: "replicon", connectorNameKey: "Replicon", clientConstructor: RepliconClient, methodName: "bulkGetProjectDetails3Async", methodArguments: [{}] },
    { displayName: "Etsy", apiName: "etsy", connectorNameKey: "EtsyIndependentPublisher", clientConstructor: EtsyClient, methodName: "pingAsync" },
    { displayName: "Elfsquad Data", apiName: "elfsquaddata", connectorNameKey: "ElfsquadData", clientConstructor: ElfsquaddataClient, methodName: "getEntitiesAsync", methodArguments: ["entity"] },
    { displayName: "Impexium", apiName: "impexium", connectorNameKey: "Impexium", clientConstructor: ImpexiumClient, methodName: "getAbandonedCheckoutsAsync", methodArguments: ["1"] },
    { displayName: "Jedox OData Hub", apiName: "jedoxodatahub", connectorNameKey: "JedoxODataHub", clientConstructor: JedoxodatahubClient, methodName: "databasesAsync" },
    { displayName: "Orderful", apiName: "orderful", connectorNameKey: "Orderful", clientConstructor: OrderfulClient, methodName: "listTransactionsAsync" },
];

const ActionConnectorCases = ConnectorCases.filter(
    (connector): connector is ConnectorCase & { methodName: string } => connector.methodName !== undefined,
);

function createMockTokenProvider(): TokenProvider {
    return {
        getAccessTokenAsync: async () => "mock-bearer-token",
    };
}

function mockFetchResponse(body: unknown, status = 200): void {
    global.fetch = jest.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        text: async () => body === undefined ? "" : JSON.stringify(body),
        headers: new Headers(),
    } as Response);
}

async function invokeRepresentativeAction(
    connector: ConnectorCase & { methodName: string },
    client: GeneratedConnectorClient,
): Promise<unknown> {
    const method = Reflect.get(client, connector.methodName) as (...methodArguments: unknown[]) => Promise<unknown>;
    return method.apply(client, connector.methodArguments ?? []);
}

describe("Phase 5-7 connector clients", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each(ConnectorCases)("should construct $displayName", connector => {
        const client = new connector.clientConstructor(TestConnectionUrl, createMockTokenProvider());

        expect(client.connectorName).toBe(connector.apiName);
    });

    it.each(ActionConnectorCases)("should invoke an authenticated $displayName action", async connector => {
        mockFetchResponse({ result: "ok" });
        const client = new connector.clientConstructor(TestConnectionUrl, createMockTokenProvider());

        await invokeRepresentativeAction(connector, client);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.headers.Authorization).toBe("Bearer mock-bearer-token");
    });

    it.each(ActionConnectorCases)("should expose $displayName failure details", async connector => {
        mockFetchResponse({ error: "not found" }, 404);
        const client = new connector.clientConstructor(TestConnectionUrl, createMockTokenProvider());

        try {
            await invokeRepresentativeAction(connector, client);
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(404);
            expect(connectorError.responseBody).toBe('{"error":"not found"}');
        }
    });

    it.each(ConnectorCases)("should register $displayName", connector => {
        expect(ConnectorNames[connector.connectorNameKey]).toBe(connector.apiName);
        expect(availableConnectors).toContain(connector.apiName);
    });

    it("should expose the Typeform response trigger", () => {
        expect(TypeformTriggerOperations.OnNewResponseWebhook).toBe("NewResponseWebhook_V2");
    });
});