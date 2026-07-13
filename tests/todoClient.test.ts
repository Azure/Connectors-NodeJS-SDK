// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    TodoClient,
    TodoList,
    ToDo,
} from "../src/generated/TodoExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/todo/abc123";

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

describe("TodoClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new TodoClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(TodoClient);
    });
});

describe("TodoClient — getAllTodoListsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET all to-do lists", async () => {
        const mockResponse: TodoList[] = [{} as TodoList];
        mockFetchResponse(mockResponse);

        const client = new TodoClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getAllTodoListsAsync();

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/lists`);
        expect(init.method).toBe("GET");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(500, '{"error":"InternalServerError"}');

        const client = new TodoClient(TestConnectionUrl, createMockTokenProvider());
        await expect(client.getAllTodoListsAsync()).rejects.toThrow(ConnectorException);
    });
});

describe("TodoClient — getToDoAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should include folder and task ids in route", async () => {
        const mockResponse: ToDo = {};
        mockFetchResponse(mockResponse);

        const client = new TodoClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getToDoAsync("list-1", "task-1");

        expect(result).toEqual(mockResponse);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/lists/list-1/tasks/task-1");
    });
});

describe("Todo — connector registry", () => {
    it("should have todo in ConnectorNames", () => {
        expect(ConnectorNames.MicrosoftToDoBusiness).toBe("todo");
    });

    it("should include todo in availableConnectors", () => {
        expect(availableConnectors).toContain("todo");
    });
});
