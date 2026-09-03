// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    TodoClient,
    TodoList,
    ToDo,
} from "../src/generated/TodoExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/todo/abc123";

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

describe("TodoClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new TodoClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(TodoClient);
    });
});

describe("TodoClient — getAllTodoListsAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET all to-do lists", async () => {
        const mockResponse: TodoList[] = [{
            displayName: "Tasks",
            wellknownListName: "defaultList",
        }];
        mockFetchResponse(mockResponse);

        const client = new TodoClient(TestConnectionUrl, createMockCredential());
        const result = await client.getAllTodoListsAsync();

        expect(result).toEqual(mockResponse);
        expect(result[0].displayName).toBe("Tasks");
        expect(result[0].wellknownListName).toBe("defaultList");
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/lists`);
        expect(init.method).toBe("GET");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(500, '{"error":"InternalServerError"}');

        const client = new TodoClient(TestConnectionUrl, createMockCredential());
        await expect(client.getAllTodoListsAsync()).rejects.toThrow(ConnectorException);
    });
});

describe("TodoClient — getToDoAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should include folder and task ids in route", async () => {
        const mockResponse: ToDo = {
            bodyLastModifiedDateTime: "2026-08-14T18:00:00Z",
            title: "Review generated contracts",
        };
        mockFetchResponse(mockResponse);

        const client = new TodoClient(TestConnectionUrl, createMockCredential());
        const result = await client.getToDoAsync("list-1", "task-1");

        expect(result).toEqual(mockResponse);
        expect(result.bodyLastModifiedDateTime).toBe("2026-08-14T18:00:00Z");
        expect(result.title).toBe("Review generated contracts");
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
