// Copyright (c) Microsoft Corporation.  All rights reserved.

import { createHttpHeaders } from "@azure/core-rest-pipeline";
import type { HttpClient, PipelineRequest, PipelineResponse } from "@azure/core-rest-pipeline";
import { AzureLogger, getLogLevel, setLogLevel } from "@azure/logger";
import { ConnectorHttpClient } from "../src/azureConnectors/connectorHttpClient.ts";
import type { AbortSignalLike, TokenCredential } from "../src/azureConnectors/index.ts";

type MockRequestHandler = (
    request: PipelineRequest,
    attempt: number,
) => PipelineResponse | Promise<PipelineResponse>;

class MockTokenCredential implements TokenCredential {
    public readonly requestedScopes = new Array<string[]>();

    public async getToken(scopes: string | string[]): Promise<{ token: string; expiresOnTimestamp: number }> {
        this.requestedScopes.push(Array.isArray(scopes) ? [...scopes] : [scopes]);
        return {
            token: "mock-bearer-token",
            expiresOnTimestamp: Number.MAX_SAFE_INTEGER,
        };
    }
}

class MockHttpClient implements HttpClient {
    public readonly requests = new Array<PipelineRequest>();

    private readonly handler: MockRequestHandler;

    public constructor(handler: MockRequestHandler) {
        this.handler = handler;
    }

    public async sendRequest(request: PipelineRequest): Promise<PipelineResponse> {
        this.requests.push(request);
        return this.handler(request, this.requests.length);
    }
}

function createMockResponse(
    request: PipelineRequest,
    status: number,
    bodyAsText = "",
    headers: Record<string, string> = {},
): PipelineResponse {
    return {
        request,
        status,
        headers: createHttpHeaders(headers),
        bodyAsText,
    };
}

function createAbortError(message: string): Error {
    const error = new Error(message);
    error.name = "AbortError";
    return error;
}

function createPlainAbortSignal(): { signal: AbortSignalLike; abort: () => void } {
    let aborted = false;
    const listeners = new Set<(this: AbortSignalLike, event: unknown) => unknown>();
    const signal: AbortSignalLike = {
        get aborted(): boolean {
            return aborted;
        },
        addEventListener(_type, listener): void {
            listeners.add(listener);
        },
        removeEventListener(_type, listener): void {
            listeners.delete(listener);
        },
    };

    return {
        signal,
        abort: (): void => {
            aborted = true;
            for (const listener of listeners) {
                listener.call(signal, { type: "abort" });
            }
        },
    };
}

async function captureConnectorLogs(action: () => Promise<void>): Promise<string[]> {
    const originalLog = AzureLogger.log;
    const originalLogLevel = getLogLevel();
    const messages = new Array<string>();
    AzureLogger.log = (...args: unknown[]): void => {
        messages.push(args.map(argument => String(argument)).join(" "));
    };
    setLogLevel("verbose");

    try {
        await action();
        return messages;
    } finally {
        setLogLevel(originalLogLevel);
        AzureLogger.log = originalLog;
    }
}

describe("ConnectorHttpClient", () => {
    it("should reject a null credential", () => {
        expect(() => new ConnectorHttpClient(null as unknown as TokenCredential))
            .toThrow("credential cannot be null or undefined.");
    });

    it("should send GET request through the pipeline with authentication and correlation", async () => {
        const credential = new MockTokenCredential();
        const httpClient = new MockHttpClient(async request => createMockResponse(
            request,
            200,
            JSON.stringify({ id: "123" }),
            { "x-response-header": "response-value" },
        ));
        const client = new ConnectorHttpClient(credential, { httpClient });

        const response = await client.sendAsync<{ id: string }>("GET", "https://example.com/api/items");

        expect(httpClient.requests).toHaveLength(1);
        const request = httpClient.requests.at(0)!;
        expect(request.url).toBe("https://example.com/api/items");
        expect(request.method).toBe("GET");
        expect(request.timeout).toBe(0);
        expect(request.headers.get("Accept")).toBe("application/json, */*;q=0.8");
        expect(request.headers.get("Authorization")).toBe("Bearer mock-bearer-token");
        expect(request.headers.get("x-ms-client-request-id")).toBe(request.requestId);
        expect(credential.requestedScopes).toEqual([["https://apihub.azure.com/.default"]]);
        expect(response.isSuccessStatusCode).toBe(true);
        expect(response.statusCode).toBe(200);
        expect(response.headers["x-response-header"]).toBe("response-value");
        expect(response.value?.id).toBe("123");
    });

    it("should send POST request with a JSON body", async () => {
        const httpClient = new MockHttpClient(async request => createMockResponse(request, 201));
        const client = new ConnectorHttpClient(new MockTokenCredential(), { httpClient });

        await client.sendAsync("POST", "https://example.com/api/items", undefined, { name: "test" });

        const request = httpClient.requests.at(0)!;
        expect(request.method).toBe("POST");
        expect(request.headers.get("Content-Type")).toBe("application/json");
        expect(JSON.parse(request.body as string)).toEqual({ name: "test" });
    });

    it("should request a token for custom scopes", async () => {
        const credential = new MockTokenCredential();
        const httpClient = new MockHttpClient(async request => createMockResponse(request, 204));
        const client = new ConnectorHttpClient(credential, { httpClient });

        await client.sendAsync("GET", "https://example.com/api/items", ["custom-scope"]);

        expect(credential.requestedScopes).toEqual([["custom-scope"]]);
    });

    it("should reuse the pipeline for repeated requests with the same scopes", async () => {
        const credential = new MockTokenCredential();
        const httpClient = new MockHttpClient(async request => createMockResponse(request, 204));
        const client = new ConnectorHttpClient(credential, { httpClient });

        await client.sendAsync("GET", "https://example.com/api/first");
        await client.sendAsync("GET", "https://example.com/api/second");

        expect(httpClient.requests).toHaveLength(2);
        expect(credential.requestedScopes).toHaveLength(1);
    });

    it("should handle responses without body text", async () => {
        const httpClient = new MockHttpClient(async request => ({
            request,
            status: 204,
            headers: createHttpHeaders(),
        }));
        const client = new ConnectorHttpClient(new MockTokenCredential(), { httpClient });

        const response = await client.sendAsync("GET", "https://example.com/api/items");

        expect(response.text).toBe("");
        expect(response.value).toBeUndefined();
    });

    it("should report non-success status codes without retrying client errors", async () => {
        const httpClient = new MockHttpClient(async request => createMockResponse(
            request,
            401,
            "Unauthorized",
            { "WWW-Authenticate": "Bearer realm=\"example\"" },
        ));
        const client = new ConnectorHttpClient(new MockTokenCredential(), {
            httpClient,
            retryOptions: { maxRetries: 2, retryDelayInMs: 1, maxRetryDelayInMs: 1 },
        });

        const response = await client.sendAsync("GET", "https://example.com/api/secret");

        expect(httpClient.requests).toHaveLength(1);
        expect(response.isSuccessStatusCode).toBe(false);
        expect(response.statusCode).toBe(401);
        expect(response.text).toBe("Unauthorized");
    });

    it("should retry transient server responses and succeed", async () => {
        const httpClient = new MockHttpClient(async (request, attempt) => attempt < 3
            ? createMockResponse(request, 503, "Unavailable")
            : createMockResponse(request, 200, JSON.stringify({ ok: true })));
        const credential = new MockTokenCredential();
        const client = new ConnectorHttpClient(credential, {
            httpClient,
            retryOptions: { maxRetries: 2, retryDelayInMs: 1, maxRetryDelayInMs: 1 },
        });

        const response = await client.sendAsync<{ ok: boolean }>("GET", "https://example.com/api/items");

        expect(httpClient.requests).toHaveLength(3);
        expect(credential.requestedScopes).toHaveLength(1);
        expect(response.statusCode).toBe(200);
        expect(response.value?.ok).toBe(true);
    });

    it("should not retry transient server responses for unsafe HTTP methods", async () => {
        const httpClient = new MockHttpClient(async request => createMockResponse(request, 503, "Unavailable"));
        const client = new ConnectorHttpClient(new MockTokenCredential(), {
            httpClient,
            retryOptions: { maxRetries: 2, retryDelayInMs: 1, maxRetryDelayInMs: 1 },
        });

        const response = await client.sendAsync("POST", "https://example.com/api/items", undefined, { name: "test" });

        expect(httpClient.requests).toHaveLength(1);
        expect(response.statusCode).toBe(503);
        expect(response.text).toBe("Unavailable");
    });

    it("should retry unsafe HTTP methods when explicitly enabled", async () => {
        const httpClient = new MockHttpClient(async (request, attempt) => attempt < 2
            ? createMockResponse(request, 503, "Unavailable")
            : createMockResponse(request, 201, JSON.stringify({ id: "123" })));
        const client = new ConnectorHttpClient(new MockTokenCredential(), {
            httpClient,
            retryOptions: { maxRetries: 2, retryDelayInMs: 1, maxRetryDelayInMs: 1 },
            retryUnsafeHttpMethods: true,
        });

        const response = await client.sendAsync<{ id: string }>(
            "POST",
            "https://example.com/api/items",
            undefined,
            { name: "test" },
        );

        expect(httpClient.requests).toHaveLength(2);
        expect(response.statusCode).toBe(201);
        expect(response.value?.id).toBe("123");
    });

    it("should return the last response after exhausting retry attempts", async () => {
        const httpClient = new MockHttpClient(async request => createMockResponse(request, 503, "Unavailable"));
        const client = new ConnectorHttpClient(new MockTokenCredential(), {
            httpClient,
            retryOptions: { maxRetries: 2, retryDelayInMs: 1, maxRetryDelayInMs: 1 },
        });

        const response = await client.sendAsync("GET", "https://example.com/api/items");

        expect(httpClient.requests).toHaveLength(3);
        expect(response.statusCode).toBe(503);
        expect(response.text).toBe("Unavailable");
    });

    it("should not retry non-pipeline errors", async () => {
        const httpClient = new MockHttpClient(async () => {
            throw new TypeError("invalid request");
        });
        const client = new ConnectorHttpClient(new MockTokenCredential(), {
            httpClient,
            retryOptions: { maxRetries: 2, retryDelayInMs: 1 },
        });

        await expect(client.sendAsync("GET", "https://example.com/api/items")).rejects.toThrow(TypeError);
        expect(httpClient.requests).toHaveLength(1);
    });

    it("should use a custom client request ID header", async () => {
        const httpClient = new MockHttpClient(async request => createMockResponse(request, 204));
        const client = new ConnectorHttpClient(new MockTokenCredential(), {
            httpClient,
            telemetryOptions: { clientRequestIdHeaderName: "x-custom-request-id" },
        });

        await client.sendAsync("GET", "https://example.com/api/items");

        const request = httpClient.requests.at(0)!;
        expect(request.headers.get("x-custom-request-id")).toBe(request.requestId);
        expect(request.headers.has("x-ms-client-request-id")).toBe(false);
    });

    it("should reject bearer authentication over HTTP", async () => {
        const httpClient = new MockHttpClient(async request => createMockResponse(request, 200));
        const client = new ConnectorHttpClient(new MockTokenCredential(), { httpClient });

        await expect(client.sendAsync("GET", "http://example.com/api/items"))
            .rejects.toThrow("non-TLS protected");
        expect(httpClient.requests).toHaveLength(0);
    });

    it("should abort immediately when caller signal is already aborted", async () => {
        const httpClient = new MockHttpClient(async request => {
            if (request.abortSignal?.aborted) {
                throw createAbortError("Transport should not send an aborted request.");
            }

            return createMockResponse(request, 200);
        });
        const controller = new AbortController();
        controller.abort();
        const client = new ConnectorHttpClient(new MockTokenCredential(), {
            httpClient,
            retryOptions: { maxRetries: 0 },
        });

        const messages = await captureConnectorLogs(async () => {
            await expect(client.sendAsync(
                "GET",
                "https://example.com/api/items",
                undefined,
                undefined,
                controller.signal,
            )).rejects.toMatchObject({ name: "AbortError" });
        });

        expect(messages).toContain("azure:connectors:info GET https://example.com canceled");
        expect(messages.some(message => message.includes("azure:connectors:warning"))).toBe(false);
        expect(messages.some(message => message.includes("azure:connectors:error"))).toBe(false);
    });

    it("should propagate a plain-object AbortSignalLike during an in-flight request", async () => {
        let markRequestStarted: (() => void) | undefined;
        const requestStarted = new Promise<void>(resolve => {
            markRequestStarted = resolve;
        });
        const httpClient = new MockHttpClient(async request => new Promise<PipelineResponse>((_resolve, reject) => {
            if (request.abortSignal?.aborted) {
                reject(createAbortError("Request was already aborted."));
                return;
            }

            request.abortSignal?.addEventListener("abort", () => reject(createAbortError("Request was aborted.")));
            markRequestStarted?.();
        }));
        const callerAbort = createPlainAbortSignal();
        const client = new ConnectorHttpClient(new MockTokenCredential(), {
            httpClient,
            retryOptions: { maxRetries: 0 },
        });

        const sendPromise = client.sendAsync(
            "GET",
            "https://example.com/api/items",
            undefined,
            undefined,
            callerAbort.signal,
        );

        await requestStarted;
        callerAbort.abort();

        await expect(sendPromise).rejects.toMatchObject({ name: "AbortError" });
    });

    it("should log request and response metadata without customer-controlled URL paths", async () => {
        const httpClient = new MockHttpClient(async request => createMockResponse(request, 200));
        const client = new ConnectorHttpClient(new MockTokenCredential(), { httpClient });

        const messages = await captureConnectorLogs(async () => {
            await client.sendAsync("GET", "https://example.com/api/messages/customer-message-id?sig=secret");
        });

        expect(messages).toEqual(expect.arrayContaining([
            expect.stringMatching(/^azure:connectors:info Request GET https:\/\/example\.com$/),
            expect.stringMatching(/^azure:connectors:info Response 200 GET https:\/\/example\.com \(\d+ms\)$/),
        ]));
        expect(messages.join("\n")).not.toMatch(/customer-message-id|secret/);
    });

    it("should log each retry attempt", async () => {
        const httpClient = new MockHttpClient(async (request, attempt) => attempt < 3
            ? createMockResponse(request, 503, "Unavailable")
            : createMockResponse(request, 200));
        const client = new ConnectorHttpClient(new MockTokenCredential(), {
            httpClient,
            retryOptions: { maxRetries: 2, retryDelayInMs: 1, maxRetryDelayInMs: 1 },
        });

        const messages = await captureConnectorLogs(async () => {
            await client.sendAsync("GET", "https://example.com/api/items");
        });

        expect(messages.filter(message => message.includes("azure:connectors:info Retry"))).toEqual([
            expect.stringMatching(/Retry 1\/2 for GET https:\/\/example\.com after \d+ms/),
            expect.stringMatching(/Retry 2\/2 for GET https:\/\/example\.com after \d+ms/),
        ]);
    });

    it("should log non-success responses as errors", async () => {
        const httpClient = new MockHttpClient(async request => createMockResponse(request, 404, "Not found"));
        const client = new ConnectorHttpClient(new MockTokenCredential(), { httpClient });

        const messages = await captureConnectorLogs(async () => {
            await client.sendAsync("GET", "https://example.com/api/customers/customer-id");
        });

        expect(messages).toEqual(expect.arrayContaining([
            expect.stringMatching(/^azure:connectors:error Response 404 GET https:\/\/example\.com \(\d+ms\)$/),
        ]));
        expect(messages.join("\n")).not.toContain("customer-id");
    });

    it("should log terminal request errors", async () => {
        const httpClient = new MockHttpClient(async () => {
            throw new TypeError("invalid request");
        });
        const client = new ConnectorHttpClient(new MockTokenCredential(), {
            httpClient,
            retryOptions: { maxRetries: 0 },
        });

        const messages = await captureConnectorLogs(async () => {
            await expect(client.sendAsync("GET", "https://example.com/api/items"))
                .rejects.toThrow("invalid request");
        });

        expect(messages).toContain("azure:connectors:warning GET https://example.com failed with TypeError");
        expect(messages.some(message => message.startsWith("azure:connectors:verbose TypeError\n"))).toBe(true);
        expect(messages.join("\n")).not.toContain("invalid request");
    });

    it("should redact malformed request URLs from logs", async () => {
        const client = new ConnectorHttpClient(new MockTokenCredential());

        const messages = await captureConnectorLogs(async () => {
            await expect(client.sendAsync("GET", "not a URL")).rejects.toThrow();
        });

        expect(messages).toContain("azure:connectors:info Request GET <invalid URL>");
        expect(messages.some(message => message.startsWith("azure:connectors:warning GET <invalid URL> failed with")))
            .toBe(true);
    });

    it("should log non-Error transport failures", async () => {
        const httpClient = new MockHttpClient(async () => Promise.reject("transport failed"));
        const client = new ConnectorHttpClient(new MockTokenCredential(), {
            httpClient,
            retryOptions: { maxRetries: 0 },
        });

        const messages = await captureConnectorLogs(async () => {
            await expect(client.sendAsync("GET", "https://example.com/api/items"))
                .rejects.toBe("transport failed");
        });

        expect(messages).toContain("azure:connectors:warning GET https://example.com failed with UnknownError");
        expect(messages.join("\n")).not.toContain("transport failed");
    });
});