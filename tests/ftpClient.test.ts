// Copyright (c) Microsoft Corporation.  All rights reserved.

import { FtpClient } from "../src/generated/FtpExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/ftp/abc123";

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
// Runtime tests
// ──────────────────────────────────────────────

describe("FtpClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new FtpClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(FtpClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new FtpClient(TestConnectionUrl + "///", createMockTokenProvider());
        expect(client).toBeDefined();
    });

    it("should throw on null connection URL", () => {
        expect(() => new FtpClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new FtpClient(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("FtpClient — getFileMetadataAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET file metadata by id and return the deserialized response", async () => {
        const metadata = { Id: "file1", Name: "data.csv", DisplayName: "data.csv" };
        mockFetchResponse(metadata);

        const client = new FtpClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getFileMetadataAsync("file1");

        expect(result).toEqual(metadata);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(url).toContain("file1");
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, "Not Found");

        const client = new FtpClient(TestConnectionUrl, createMockTokenProvider());
        await expect(client.getFileMetadataAsync("missing")).rejects.toThrow(ConnectorException);
    });
});

describe("Ftp — connector registry", () => {
    it("should expose FTP in ConnectorNames", () => {
        expect(ConnectorNames.FTP).toBe("ftp");
    });

    it("should include ftp in availableConnectors", () => {
        expect(availableConnectors).toContain("ftp");
    });
});
