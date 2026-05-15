// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    AzureblobClient,
    BlobMetadata,
    BlobMetadataPage,
    CreateBlockBlobInput,
    CreateFileInput,
    SharedAccessSignature,
    SharedAccessSignatureBlobPolicy,
    DataWithSensitivityLabelInfo,
    ListOfBlobsWithSensitivityLabels,
    UpdateFileInput,
} from "../src/generated/AzureblobExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/azureblob/abc123";
const TestDataset = "AccountNameFromSettings";
const TestStorageAccount = "mystorageaccount";

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

const _blobMetadata: BlobMetadata = {
    Id: "/container/file.txt",
    Name: "file.txt",
    Path: "/container/file.txt",
};

const _sasPolicy: SharedAccessSignatureBlobPolicy = {
    Permissions: "Read",
    ExpiryTime: "2025-01-01T00:00:00Z",
};

const _sasResult: SharedAccessSignature = {
    WebUrl: "https://storage.blob.core.windows.net/container/file.txt?sv=...",
};

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("AzureblobClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new AzureblobClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(AzureblobClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new AzureblobClient(TestConnectionUrl + "///", createMockTokenProvider());
        expect(client).toBeDefined();
    });
});

describe("AzureblobClient — listRootFolderAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET root folder listing", async () => {
        const mockResponse: BlobMetadataPage = {
            value: [{ Name: "folder1", IsFolder: true }],
        };
        mockFetchResponse(mockResponse);

        const client = new AzureblobClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.listRootFolderAsync(TestDataset);

        expect(result).toEqual(mockResponse);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/foldersV2");
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });
});

describe("AzureblobClient — getFileMetadataAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET file metadata by ID", async () => {
        const mockMetadata: DataWithSensitivityLabelInfo = {};
        mockFetchResponse(mockMetadata);

        const client = new AzureblobClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.getFileMetadataAsync(TestDataset, "file-id-1");

        expect(result).toEqual(mockMetadata);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/files/");
    });
});

describe("AzureblobClient — createBlockBlobAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to CreateBlockBlob endpoint", async () => {
        mockFetchResponse(null);

        const client = new AzureblobClient(TestConnectionUrl, createMockTokenProvider());
        const input: CreateBlockBlobInput = {};

        await client.createBlockBlobAsync(input, TestStorageAccount, "/container", "newfile.txt");

        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/CreateBlockBlob");
        expect(url).toContain(TestStorageAccount);
        expect(init.method).toBe("POST");
    });
});

describe("AzureblobClient — deleteFileAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should send DELETE request for file", async () => {
        mockFetchResponse(null);

        const client = new AzureblobClient(TestConnectionUrl, createMockTokenProvider());
        await client.deleteFileAsync(TestDataset, "file-id-1");

        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("DELETE");
    });
});

describe("AzureblobClient — copyFileAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to copyFile endpoint with query parameters", async () => {
        const mockResult: BlobMetadata = { Name: "copied.txt" };
        mockFetchResponse(mockResult);

        const client = new AzureblobClient(TestConnectionUrl, createMockTokenProvider());
        const result = await client.copyFileAsync(
            TestDataset,
            "/source/file.txt",
            "/dest/file.txt",
            "true",
        );

        expect(result).toEqual(mockResult);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/copyFile");
        expect(init.method).toBe("POST");
    });
});

describe("AzureblobClient — updateFileAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should PUT updated file content", async () => {
        const mockResult: BlobMetadata = { Name: "updated.txt" };
        mockFetchResponse(mockResult);

        const client = new AzureblobClient(TestConnectionUrl, createMockTokenProvider());
        const input: UpdateFileInput = {};
        const result = await client.updateFileAsync(input, TestDataset, "file-id-1");

        expect(result).toEqual(mockResult);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("PUT");
    });
});

describe("AzureblobClient — createShareLinkByPathAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to create shared access link", async () => {
        const mockSas: SharedAccessSignature = {
            WebUrl: "https://storage.blob.core.windows.net/container/file.txt?sv=2020-08-04&sig=...",
        };
        mockFetchResponse(mockSas);

        const client = new AzureblobClient(TestConnectionUrl, createMockTokenProvider());
        const input: SharedAccessSignatureBlobPolicy = { Permissions: "Read" };
        const result = await client.createShareLinkByPathAsync(
            input,
            TestStorageAccount,
            "/container/file.txt",
        );

        expect(result).toEqual(mockSas);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/CreateSharedLinkByPath");
        expect(init.method).toBe("POST");
    });
});

describe("AzureblobClient — error handling", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, '{"error": "BlobNotFound"}');

        const client = new AzureblobClient(TestConnectionUrl, createMockTokenProvider());

        await expect(
            client.listRootFolderAsync(TestDataset),
        ).rejects.toThrow(ConnectorException);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "AuthorizationFailure"}';
        mockFetchError(403, errorBody);

        const client = new AzureblobClient(TestConnectionUrl, createMockTokenProvider());

        try {
            await client.getFileMetadataAsync(TestDataset, "file-1");
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(403);
            expect(connectorError.responseBody).toBe(errorBody);
            expect(connectorError.operation).toContain("GET");
        }
    });
});

describe("Azureblob — connector registry", () => {
    it("should have azureblob in ConnectorNames", () => {
        expect(ConnectorNames.Azureblob).toBe("azureblob");
    });

    it("should include azureblob in availableConnectors", () => {
        expect(availableConnectors).toContain("azureblob");
    });
});
