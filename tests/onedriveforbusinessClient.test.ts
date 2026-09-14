// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import {
    OnedriveforbusinessClient,
    BlobMetadata,
    BlobMetadataPage,
    CreateFileInput,
    UpdateFileInput,
    SharingLink,
    Thumbnail,
} from "../src/generated/OnedriveforbusinessExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/onedriveforbusiness/abc123";

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
    Id: "/Documents/file.docx",
    Name: "file.docx",
    Path: "/Documents/file.docx",
};

const _sharingLink: SharingLink = {
    WebUrl: "https://contoso-my.sharepoint.com/:w:/g/personal/user/abc123",
};

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("OnedriveforbusinessClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new OnedriveforbusinessClient(TestConnectionUrl, createMockCredential());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(OnedriveforbusinessClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new OnedriveforbusinessClient(TestConnectionUrl + "///", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should construct with an empty connection URL", () => {
        const client = new OnedriveforbusinessClient("", createMockCredential());
        expect(client).toBeDefined();
    });

    it("should throw on null connection URL", () => {
        expect(() => new OnedriveforbusinessClient(null as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new OnedriveforbusinessClient(undefined as unknown as string, createMockCredential()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("OnedriveforbusinessClient — listRootFolderAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET /datasets/default/folders", async () => {
        const mockFiles: BlobMetadata[] = [
            { Name: "Documents", IsFolder: true },
            { Name: "report.pdf", IsFolder: false },
        ];
        mockFetchResponse(mockFiles);

        const client = new OnedriveforbusinessClient(TestConnectionUrl, createMockCredential());
        const result = await client.listRootFolderAsync();

        expect(result).toEqual(mockFiles);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/datasets/default/folders");
        expect(init.method).toBe("GET");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
    });
});

describe("OnedriveforbusinessClient — getFileMetadataAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET file metadata by ID", async () => {
        const mockMetadata: BlobMetadata = {
            Id: "file-1",
            Name: "report.pdf",
            Path: "/Documents/report.pdf",
        };
        mockFetchResponse(mockMetadata);

        const client = new OnedriveforbusinessClient(TestConnectionUrl, createMockCredential());
        const result = await client.getFileMetadataAsync("file-1");

        expect(result).toEqual(mockMetadata);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/datasets/default/files/file-1");
    });
});

describe("OnedriveforbusinessClient — createFileAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to create a new file", async () => {
        const mockResult: BlobMetadata = { Name: "newfile.txt" };
        mockFetchResponse(mockResult);

        const client = new OnedriveforbusinessClient(TestConnectionUrl, createMockCredential());
        const input: CreateFileInput = "file content";
        const result = await client.createFileAsync(input, "/Documents", "newfile.txt");

        expect(result).toEqual(mockResult);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/datasets/default/files");
        expect(init.method).toBe("POST");
    });
});

describe("OnedriveforbusinessClient — updateFileAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should PUT updated file content", async () => {
        const mockResult: BlobMetadata = { Name: "updated.txt" };
        mockFetchResponse(mockResult);

        const client = new OnedriveforbusinessClient(TestConnectionUrl, createMockCredential());
        const input: UpdateFileInput = "updated content";
        const result = await client.updateFileAsync(input, "file-1");

        expect(result).toEqual(mockResult);
        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(init.method).toBe("PUT");
    });
});

describe("OnedriveforbusinessClient — deleteFileAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should send DELETE request for file", async () => {
        mockFetchResponse(null);

        const client = new OnedriveforbusinessClient(TestConnectionUrl, createMockCredential());
        await client.deleteFileAsync("file-1");

        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/datasets/default/files/file-1");
        expect(init.method).toBe("DELETE");
    });
});

describe("OnedriveforbusinessClient — copyFileAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to copyFile endpoint", async () => {
        const mockResult: BlobMetadata = { Name: "copied.docx" };
        mockFetchResponse(mockResult);

        const client = new OnedriveforbusinessClient(TestConnectionUrl, createMockCredential());
        const result = await client.copyFileAsync("/source.docx", "/dest/source.docx");

        expect(result).toEqual(mockResult);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/datasets/default/copyFile");
        expect(init.method).toBe("POST");
    });
});

describe("OnedriveforbusinessClient — createShareLinkAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to create sharing link", async () => {
        const mockLink: SharingLink = {
            WebUrl: "https://contoso-my.sharepoint.com/share/abc",
        };
        mockFetchResponse(mockLink);

        const client = new OnedriveforbusinessClient(TestConnectionUrl, createMockCredential());
        const result = await client.createShareLinkAsync("file-1", "view", "organization");

        expect(result).toEqual(mockLink);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/datasets/default/files/file-1/shareV2");
        expect(init.method).toBe("POST");
    });
});

describe("OnedriveforbusinessClient — listFolderAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET folder contents with pagination", async () => {
        const mockPage: BlobMetadataPage = {
            value: [{ Name: "child.txt" }],
        };
        mockFetchResponse(mockPage);

        const client = new OnedriveforbusinessClient(TestConnectionUrl, createMockCredential());
        const result = await client.listFolderAsync("folder-1").byPage().next();

        expect(result.value).toEqual(mockPage.value);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/datasets/default/foldersV2/folder-1");
    });
});

describe("OnedriveforbusinessClient — findFilesAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should GET search results in a folder", async () => {
        const mockResults: BlobMetadata[] = [{ Name: "match.docx" }];
        mockFetchResponse(mockResults);

        const client = new OnedriveforbusinessClient(TestConnectionUrl, createMockCredential());
        const result = await client.findFilesAsync("folder-1", "report");

        expect(result).toEqual(mockResults);
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain("/datasets/default/folders/folder-1/search");
        expect(url).toContain("query=report");
    });
});

describe("OnedriveforbusinessClient — error handling", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(404, '{"error": "itemNotFound"}');

        const client = new OnedriveforbusinessClient(TestConnectionUrl, createMockCredential());

        await expect(
            client.getFileMetadataAsync("nonexistent-id"),
        ).rejects.toThrow(ConnectorException);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "accessDenied"}';
        mockFetchError(403, errorBody);

        const client = new OnedriveforbusinessClient(TestConnectionUrl, createMockCredential());

        try {
            await client.listRootFolderAsync();
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

describe("Onedriveforbusiness — connector registry", () => {
    it("should have onedriveforbusiness in ConnectorNames", () => {
        expect(ConnectorNames.OneDriveForBusiness).toBe("onedriveforbusiness");
    });

    it("should include onedriveforbusiness in availableConnectors", () => {
        expect(availableConnectors).toContain("onedriveforbusiness");
    });
});
