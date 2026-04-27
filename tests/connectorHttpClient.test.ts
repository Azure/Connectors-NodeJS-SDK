// Copyright (c) Microsoft Corporation.  All rights reserved.

import { ConnectorHttpClient, ConnectorResponse } from "../src/azureConnectors/connectorHttpClient";
import { TokenProvider } from "../src/azureConnectors/authentication";

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
});
