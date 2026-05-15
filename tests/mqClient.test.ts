// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    MqClient,
    SendValidDataOptions,
    SingleGetValidOptions,
    MultipleGetValidOptions,
    SendResponse,
    Item,
    ItemsList,
} from "../src/generated/MqExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/mq/abc123";

function createMockTokenProvider(): TokenProvider {
    return {
        getAccessTokenAsync: async () => "mock-bearer-token",
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

describe("MqClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new MqClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(MqClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new MqClient(TestConnectionUrl + "///", createMockTokenProvider());
        expect(client).toBeDefined();
    });

    it("should construct with an empty connection URL", () => {
        const client = new MqClient("", createMockTokenProvider());
        expect(client).toBeDefined();
    });
});

describe("MqClient — sendAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/send with correct body and headers", async () => {
        const mockResponse: SendResponse = { ItemInternalId: "msg-001" };
        mockFetchResponse(mockResponse);

        const client = new MqClient(TestConnectionUrl, createMockTokenProvider());
        const input: SendValidDataOptions = {
            Queue: "MY.QUEUE",
            Message: "Test message",
            MessageType: "TEXT",
        };

        const result = await client.sendAsync(input);

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

describe("MqClient — receiveAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/receive", async () => {
        const mockItem: Item = {};
        mockFetchResponse(mockItem);

        const client = new MqClient(TestConnectionUrl, createMockTokenProvider());
        const input: SingleGetValidOptions = { Queue: "MY.QUEUE" };

        const result = await client.receiveAsync(input);

        expect(result).toEqual(mockItem);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v2/receive`);
        expect(init.method).toBe("POST");
    });
});

describe("MqClient — receiveAllAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/receiveall", async () => {
        const mockItems: ItemsList = {};
        mockFetchResponse(mockItems);

        const client = new MqClient(TestConnectionUrl, createMockTokenProvider());
        const input: MultipleGetValidOptions = { Queue: "MY.QUEUE" };

        const result = await client.receiveAllAsync(input);

        expect(result).toEqual(mockItems);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v2/receiveall`);
    });
});

describe("MqClient — readAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/read", async () => {
        const mockItem: Item = {};
        mockFetchResponse(mockItem);

        const client = new MqClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.readAsync({ Queue: "MY.QUEUE" });

        expect(result).toEqual(mockItem);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v2/read`);
    });
});

describe("MqClient — readAllAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/readall", async () => {
        const mockItems: ItemsList = {};
        mockFetchResponse(mockItems);

        const client = new MqClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.readAllAsync({ Queue: "MY.QUEUE" });

        expect(result).toEqual(mockItems);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v2/readall`);
    });
});

describe("MqClient — deleteAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/delete", async () => {
        const mockItem: Item = {};
        mockFetchResponse(mockItem);

        const client = new MqClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.deleteAsync({ Queue: "MY.QUEUE", MessageId: "msg-1" });

        expect(result).toEqual(mockItem);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v2/delete`);
        expect(init.method).toBe("POST");
    });
});

describe("MqClient — deleteAllAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /v2/deleteall", async () => {
        const mockItems: ItemsList = {};
        mockFetchResponse(mockItems);

        const client = new MqClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.deleteAllAsync({ Queue: "MY.QUEUE" });

        expect(result).toEqual(mockItems);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v2/deleteall`);
    });
});

describe("MqClient — error handling", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(500, '{"error": "QueueNotFound"}');

        const client = new MqClient(TestConnectionUrl, createMockTokenProvider());

        await expect(
            client.sendAsync({ Queue: "BAD.QUEUE", Message: "test" }),
        ).rejects.toThrow(ConnectorException);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "Unauthorized"}';
        mockFetchError(401, errorBody);

        const client = new MqClient(TestConnectionUrl, createMockTokenProvider());

        try {
            await client.receiveAsync({ Queue: "MY.QUEUE" });
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(401);
            expect(connectorError.responseBody).toBe(errorBody);
            expect(connectorError.operation).toContain("POST");
        }
    });
});

describe("Mq — connector registry", () => {
    it("should have mq in ConnectorNames", () => {
        expect(ConnectorNames.Mq).toBe("mq");
    });

    it("should include mq in availableConnectors", () => {
        expect(availableConnectors).toContain("mq");
    });
});
