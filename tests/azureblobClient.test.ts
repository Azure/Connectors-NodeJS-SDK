// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    AzureBlobClient,
    BlobMetadata,
    BlobMetadataPage,
    CreateBlockBlobInput,
    CreateFileInput,
    SharedAccessSignature,
    SharedAccessSignatureBlobPolicy,
    DataWithSensitivityLabelInfo,
    ListOfBlobsWithSensitivityLabels,
    UpdateFileInput,
} from "../src/generated/AzureBlobExtensions.ts";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/azureblob/abc123";
const TestDataset = "AccountNameFromSettings";
const TestStorageAccount = "mystorageaccount";

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

describe("AzureBlobClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new AzureBlobClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(AzureBlobClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new AzureBlobClient(TestConnectionUrl + "///", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should construct with an empty connection URL", () => {
        const client = new AzureBlobClient("", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should throw on null connection URL", () => {
        expect(() => new AzureBlobClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new AzureBlobClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("AzureBlobClient — listRootFolder", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET root folder listing", async () => {
        const mockResponse: BlobMetadataPage = {
            value: [{ Name: "folder1", IsFolder: true }],
        };
        mockFetchResponse(mockResponse);

        const client = new AzureBlobClient(TestConnectionUrl, createMockCredential());
        const result = await client.listRootFolder(TestDataset).byPage().next();

        expect(result.value).toEqual(mockResponse.value);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/foldersV2");
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });
});

describe("AzureBlobClient — getFileMetadata", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET file metadata by ID", async () => {
        const mockMetadata: DataWithSensitivityLabelInfo = {};
        mockFetchResponse(mockMetadata);

        const client = new AzureBlobClient(TestConnectionUrl, createMockCredential());
        const result = await client.getFileMetadata(TestDataset, "file-id-1");

        expect(result).toEqual(mockMetadata);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/files/");
    });
});

describe("AzureBlobClient — createBlockBlob", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to CreateBlockBlob endpoint", async () => {
        mockFetchResponse(null);

        const client = new AzureBlobClient(TestConnectionUrl, createMockCredential());
        const input: CreateBlockBlobInput = new Blob(["file content"], { type: "text/plain" });

        await client.createBlockBlob(input, TestStorageAccount, "/container", "newfile.txt");

        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/CreateBlockBlob");
        expect(url).toContain(TestStorageAccount);
        expect(init.method).toBe("POST");
    });
});

describe("AzureBlobClient — deleteFile", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should send DELETE request for file", async () => {
        mockFetchResponse(null);

        const client = new AzureBlobClient(TestConnectionUrl, createMockCredential());
        await client.deleteFile(TestDataset, "file-id-1");

        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("DELETE");
    });
});

describe("AzureBlobClient — copyFile", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to copyFile endpoint with query parameters", async () => {
        const mockResult: BlobMetadata = { Name: "copied.txt" };
        mockFetchResponse(mockResult);

        const client = new AzureBlobClient(TestConnectionUrl, createMockCredential());
        const result = await client.copyFile(
            TestDataset,
            "/source/file.txt",
            "/dest/file.txt",
            { overwrite: true },
        );

        expect(result).toEqual(mockResult);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/copyFile");
        expect(init.method).toBe("POST");
    });
});

describe("AzureBlobClient — updateFile", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should PUT updated file content", async () => {
        const mockResult: BlobMetadata = { Name: "updated.txt" };
        mockFetchResponse(mockResult);

        const client = new AzureBlobClient(TestConnectionUrl, createMockCredential());
        const input: UpdateFileInput = new Blob(["updated content"], { type: "text/plain" });
        const result = await client.updateFile(input, TestDataset, "file-id-1");

        expect(result).toEqual(mockResult);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("PUT");
    });
});

describe("AzureBlobClient — createShareLinkByPath", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to create shared access link", async () => {
        const mockSas: SharedAccessSignature = {
            WebUrl: "https://storage.blob.core.windows.net/container/file.txt?sv=2020-08-04&sig=...",
        };
        mockFetchResponse(mockSas);

        const client = new AzureBlobClient(TestConnectionUrl, createMockCredential());
        const input: SharedAccessSignatureBlobPolicy = { Permissions: "Read" };
        const result = await client.createShareLinkByPath(
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

describe("AzureBlobClient — error handling", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw ConnectorError on non-OK response", async () => {
        mockFetchError(404, '{"error": "BlobNotFound"}');

        const client = new AzureBlobClient(TestConnectionUrl, createMockCredential());

        await expect(
            client.listRootFolder(TestDataset).byPage().next(),
        ).rejects.toThrow(ConnectorError);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "AuthorizationFailure"}';
        mockFetchError(403, errorBody);

        const client = new AzureBlobClient(TestConnectionUrl, createMockCredential());

        try {
            await client.getFileMetadata(TestDataset, "file-1");
            throw new Error("Expected ConnectorError to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorError);
            const connectorError = error as ConnectorError;
            expect(connectorError.statusCode).toBe(403);
            expect(connectorError.responseBody).toBe(errorBody);
            expect(connectorError.operation).toBe("GetFileMetadata_V2");
            expect(connectorError.request.url).toContain("file-1");
        }
    });
});

describe("Azureblob — connector registry", () => {
    it("should have azureblob in ConnectorNames", () => {
        expect(ConnectorNames.AzureBlobStorage).toBe("azureblob");
    });

    it("should include azureblob in availableConnectors", () => {
        expect(availableConnectors).toContain("azureblob");
    });
});
