// Copyright (c) Microsoft Corporation.  All rights reserved.

import { ConnectorHttpClient, ConnectorResponse } from "../src/azureConnectors/connectorHttpClient.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";

class MockTokenProvider implements TokenProvider {
    public async getAccessTokenAsync(_scopes: string[]): Promise<string> {
        return "mock-bearer-token";
    }
}

describe("ConnectorHttpClient", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it("should send GET request with auth header", async () => {
        let capturedUrl: string | undefined;
        let capturedInit: RequestInit | undefined;

        global.fetch = async (input: string | URL | Request, init?: RequestInit) => {
            capturedUrl = typeof input === "string" ? input : input.toString();
            capturedInit = init;
            return new Response(JSON.stringify({ id: "123" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        };

        const client = new ConnectorHttpClient(new MockTokenProvider());
        const response = await client.sendAsync<{ id: string }>("GET", "https://example.com/api/items");

        expect(capturedUrl).toBe("https://example.com/api/items");
        expect(capturedInit?.method).toBe("GET");

        const headers = capturedInit!.headers as Record<string, string>;
        expect(headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(response.isSuccessStatusCode).toBe(true);
        expect(response.statusCode).toBe(200);
        expect(response.value?.id).toBe("123");
    });

    it("should send POST request with body", async () => {
        let capturedInit: RequestInit | undefined;

        global.fetch = async (_input: string | URL | Request, init?: RequestInit) => {
            capturedInit = init;
            return new Response(null, { status: 201 });
        };

        const client = new ConnectorHttpClient(new MockTokenProvider());
        await client.sendAsync("POST", "https://example.com/api/items", undefined, { name: "test" });

        expect(capturedInit?.method).toBe("POST");
        const headers = capturedInit!.headers as Record<string, string>;
        expect(headers["Content-Type"]).toBe("application/json");

        const body = JSON.parse(capturedInit!.body as string);
        expect(body.name).toBe("test");
    });

    it("should report non-success status codes", async () => {
        global.fetch = async () => {
            return new Response("Unauthorized", { status: 401 });
        };

        const client = new ConnectorHttpClient(new MockTokenProvider());
        const response = await client.sendAsync("GET", "https://example.com/api/secret");

        expect(response.isSuccessStatusCode).toBe(false);
        expect(response.statusCode).toBe(401);
        expect(response.text).toBe("Unauthorized");
    });

    it("should retry on transient failure and succeed", async () => {
        let attempts = 0;
        global.fetch = jest.fn(async () => {
            attempts++;
            if (attempts < 2) {
                throw new Error("network down");
            }

            return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }) as unknown as typeof fetch;

        const client = new ConnectorHttpClient(new MockTokenProvider(), {
            maxRetryAttempts: 3,
            initialRetryDelayMs: 1,
            useExponentialBackoff: false,
        });
        const response = await client.sendAsync<{ ok: boolean }>("GET", "https://example.com/api/items");

        expect(attempts).toBe(2);
        expect(response.statusCode).toBe(200);
        expect(response.value?.ok).toBe(true);
    });

    it("should throw after exhausting retry attempts", async () => {
        let attempts = 0;
        global.fetch = jest.fn(async () => {
            attempts++;
            throw new Error("persistent failure");
        }) as unknown as typeof fetch;

        const client = new ConnectorHttpClient(new MockTokenProvider(), {
            maxRetryAttempts: 3,
            initialRetryDelayMs: 1,
            useExponentialBackoff: false,
        });

        await expect(client.sendAsync("GET", "https://example.com/api/items")).rejects.toThrow("persistent failure");
        expect(attempts).toBe(3);
    });

    it("should use exponential backoff between retries when enabled", async () => {
        let attempts = 0;
        global.fetch = jest.fn(async () => {
            attempts++;
            if (attempts < 3) {
                throw new Error("network down");
            }

            return new Response(null, { status: 204 });
        }) as unknown as typeof fetch;

        const client = new ConnectorHttpClient(new MockTokenProvider(), {
            maxRetryAttempts: 3,
            initialRetryDelayMs: 1,
            useExponentialBackoff: true,
        });
        const response = await client.sendAsync("GET", "https://example.com/api/items");

        expect(attempts).toBe(3);
        expect(response.statusCode).toBe(204);
    });

    it("should not retry on TypeError (non-transient)", async () => {
        let attempts = 0;
        global.fetch = jest.fn(async () => {
            attempts++;
            throw new TypeError("invalid url");
        }) as unknown as typeof fetch;

        const client = new ConnectorHttpClient(new MockTokenProvider(), {
            maxRetryAttempts: 3,
            initialRetryDelayMs: 1,
        });

        await expect(client.sendAsync("GET", "bad-url")).rejects.toThrow(TypeError);
        expect(attempts).toBe(1);
    });

    it("should not retry on SyntaxError (non-transient)", async () => {
        let attempts = 0;
        global.fetch = jest.fn(async () => {
            attempts++;
            throw new SyntaxError("bad syntax");
        }) as unknown as typeof fetch;

        const client = new ConnectorHttpClient(new MockTokenProvider(), {
            maxRetryAttempts: 3,
            initialRetryDelayMs: 1,
        });

        await expect(client.sendAsync("GET", "https://example.com")).rejects.toThrow(SyntaxError);
        expect(attempts).toBe(1);
    });

    it("should abort immediately when caller signal is already aborted", async () => {
        global.fetch = jest.fn(async (_input: string | URL | Request, init?: RequestInit) => {
            return new Promise((_resolve, reject) => {
                const signal = init?.signal;
                if (signal?.aborted) {
                    reject(new Error("AbortError"));
                    return;
                }

                signal?.addEventListener("abort", () => reject(new Error("AbortError")));
            });
        }) as unknown as typeof fetch;

        const controller = new AbortController();
        controller.abort();

        const client = new ConnectorHttpClient(new MockTokenProvider(), {
            maxRetryAttempts: 1,
            initialRetryDelayMs: 1,
        });

        await expect(
            client.sendAsync("GET", "https://example.com/api/items", undefined, undefined, controller.signal),
        ).rejects.toThrow();
    });

    it("should propagate caller abort during in-flight request", async () => {
        global.fetch = jest.fn(async (_input: string | URL | Request, init?: RequestInit) => {
            return new Promise((_resolve, reject) => {
                const signal = init?.signal;
                if (signal?.aborted) {
                    reject(new Error("AbortError"));
                    return;
                }

                signal?.addEventListener("abort", () => reject(new Error("AbortError")));
            });
        }) as unknown as typeof fetch;

        const controller = new AbortController();
        const client = new ConnectorHttpClient(new MockTokenProvider(), {
            maxRetryAttempts: 1,
            initialRetryDelayMs: 1,
        });

        const sendPromise = client.sendAsync(
            "GET",
            "https://example.com/api/items",
            undefined,
            undefined,
            controller.signal,
        );

        controller.abort();

        await expect(sendPromise).rejects.toThrow();
    });
});
