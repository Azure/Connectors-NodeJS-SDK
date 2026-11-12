// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    MQClient,
    SendValidDataOptions,
    SingleGetValidOptions,
    MultipleGetValidOptions,
    SendResponse,
    Item,
    ItemsList,
} from "../src/generated/MQExtensions.ts";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/mq/abc123";

function createMockCredential(): TokenCredential {
    return {
        getToken: async () => ({ token: "mock-bearer-token", expiresOnTimestamp: Number.MAX_SAFE_INTEGER }),
    };
}

function mockFetchResponse(body: unknown, status = 200): void {
    global.fetch = jest.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        text: async () => (body !== undefined && body !== null ? JSON.stringify(body) : ""),
        headers: new Headers(),
    } as Response);
}

function mockFetchError(status: number, errorBody: string): void {
    global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status,
        text: async () => errorBody,
        headers: new Headers(),
    } as Response);
}

// ──────────────────────────────────────────────
// Type-level compile-time checks
// ──────────────────────────────────────────────

const _sendInput: SendValidDataOptions = {
    Queue: "MY.QUEUE",
    Message: "Hello from MQ",
};

const _singleGetInput: SingleGetValidOptions = {
    Queue: "MY.QUEUE",
};

const _multipleGetInput: MultipleGetValidOptions = {
    Queue: "MY.QUEUE",
};

const _sendResponse: SendResponse = {
    ItemInternalId: "item-1",
};

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("MQClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new MQClient(
            TestConnectionUrl,
            createMockCredential(),
            { retryOptions: { maxRetries: 0 } },
        );
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(MQClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new MQClient(TestConnectionUrl + "///", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should construct with an empty connection URL", () => {
        const client = new MQClient("", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should throw on null connection URL", () => {
        expect(() => new MQClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new MQClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("MQClient — send", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/send with correct body and headers", async () => {
        const mockResponse: SendResponse = { ItemInternalId: "msg-001" };
        mockFetchResponse(mockResponse);

        const client = new MQClient(TestConnectionUrl, createMockCredential());
        const input: SendValidDataOptions = {
            Queue: "MY.QUEUE",
            Message: "Test message",
            MessageType: "TEXT",
        };

        const result = await client.send(input);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledTimes(1);

        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v2/send`);
        expect(init.method).toBe("POST");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(init.headers["Content-Type"]).toBe("application/json");
        expect(JSON.parse(init.body)).toEqual(input);
    });
});

describe("MQClient — receive", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/receive", async () => {
        const mockItem: Item = { MessageData: "test-data" };
        mockFetchResponse(mockItem);

        const client = new MQClient(TestConnectionUrl, createMockCredential());
        const input: SingleGetValidOptions = { Queue: "MY.QUEUE" };

        const result = await client.receive(input);

        expect(result).toEqual(mockItem);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v2/receive`);
        expect(init.method).toBe("POST");
    });
});

describe("MQClient — receiveAll", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/receiveall", async () => {
        const mockItems: ItemsList = {};
        mockFetchResponse(mockItems);

        const client = new MQClient(TestConnectionUrl, createMockCredential());
        const input: MultipleGetValidOptions = { Queue: "MY.QUEUE" };

        const result = await client.receiveAll(input);

        expect(result).toEqual(mockItems);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v2/receiveall`);
    });
});

describe("MQClient — read", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/read", async () => {
        const mockItem: Item = { MessageData: "test-data" };
        mockFetchResponse(mockItem);

        const client = new MQClient(TestConnectionUrl, createMockCredential());
        const result = await client.read({ Queue: "MY.QUEUE" });

        expect(result).toEqual(mockItem);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v2/read`);
    });
});

describe("MQClient — readAll", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/readall", async () => {
        const mockItems: ItemsList = {};
        mockFetchResponse(mockItems);

        const client = new MQClient(TestConnectionUrl, createMockCredential());
        const result = await client.readAll({ Queue: "MY.QUEUE" });

        expect(result).toEqual(mockItems);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v2/readall`);
    });
});

describe("MQClient — delete", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/delete", async () => {
        const mockItem: Item = { MessageData: "test-data" };
        mockFetchResponse(mockItem);

        const client = new MQClient(TestConnectionUrl, createMockCredential());
        const result = await client.delete({ Queue: "MY.QUEUE", MessageId: "msg-1" });

        expect(result).toEqual(mockItem);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v2/delete`);
        expect(init.method).toBe("POST");
    });
});

describe("MQClient — deleteAll", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/deleteall", async () => {
        const mockItems: ItemsList = {};
        mockFetchResponse(mockItems);

        const client = new MQClient(TestConnectionUrl, createMockCredential());
        const result = await client.deleteAll({ Queue: "MY.QUEUE" });

        expect(result).toEqual(mockItems);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v2/deleteall`);
    });
});

describe("MQClient — error handling", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw ConnectorError on non-OK response", async () => {
        mockFetchError(500, '{"error": "QueueNotFound"}');

        const client = new MQClient(
            TestConnectionUrl,
            createMockCredential(),
            { retryOptions: { maxRetries: 0 } },
        );

        await expect(
            client.send({ Queue: "BAD.QUEUE", Message: "test" }),
        ).rejects.toThrow(ConnectorError);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "Unauthorized"}';
        mockFetchError(401, errorBody);

        const client = new MQClient(TestConnectionUrl, createMockCredential());

        try {
            await client.receive({ Queue: "MY.QUEUE" });
            throw new Error("Expected ConnectorError to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorError);
            const connectorError = error as ConnectorError;
            expect(connectorError.statusCode).toBe(401);
            expect(connectorError.responseBody).toBe(errorBody);
            expect(connectorError.operation).toBe("ReceiveV2");
        }
    });
});

describe("Mq — connector registry", () => {
    it("should have mq in ConnectorNames", () => {
        expect(ConnectorNames.MQ).toBe("mq");
    });

    it("should include mq in availableConnectors", () => {
        expect(availableConnectors).toContain("mq");
    });
});
