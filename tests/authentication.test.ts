// Copyright (c) Microsoft Corporation.  All rights reserved.

const mockGetToken = jest.fn();
const defaultAzureCredentialCtor = jest.fn();
const managedIdentityCredentialCtor = jest.fn();

jest.mock("@azure/identity", () => ({
    DefaultAzureCredential: jest.fn().mockImplementation((...args: unknown[]) => {
        defaultAzureCredentialCtor(...args);
        return { getToken: mockGetToken };
    }),
    ManagedIdentityCredential: jest.fn().mockImplementation((...args: unknown[]) => {
        managedIdentityCredentialCtor(...args);
        return { getToken: mockGetToken };
    }),
}));

import { ConnectionStringTokenProvider, ManagedIdentityTokenProvider } from "../src/azureConnectors/authentication.ts";

describe("ConnectionStringTokenProvider", () => {
    it("should throw when API key is empty", () => {
        expect(() => new ConnectionStringTokenProvider("")).toThrow("API key cannot be null or empty.");
    });

    it("should return the API key as token", async () => {
        const provider = new ConnectionStringTokenProvider("test-api-key");
        const token = await provider.getAccessTokenAsync(["scope"]);
        expect(token).toBe("test-api-key");
    });
});

describe("ManagedIdentityTokenProvider", () => {
    beforeEach(() => {
        mockGetToken.mockReset();
        defaultAzureCredentialCtor.mockReset();
        managedIdentityCredentialCtor.mockReset();
    });

    it("should use DefaultAzureCredential when no clientId is provided", () => {
        new ManagedIdentityTokenProvider();
        expect(defaultAzureCredentialCtor).toHaveBeenCalledTimes(1);
        expect(managedIdentityCredentialCtor).not.toHaveBeenCalled();
    });

    it("should use ManagedIdentityCredential when clientId is provided", () => {
        new ManagedIdentityTokenProvider("client-id-123");
        expect(managedIdentityCredentialCtor).toHaveBeenCalledWith("client-id-123");
        expect(defaultAzureCredentialCtor).not.toHaveBeenCalled();
    });

    it("should throw when scopes are empty", async () => {
        const provider = new ManagedIdentityTokenProvider();
        await expect(provider.getAccessTokenAsync([])).rejects.toThrow("At least one scope must be provided.");
    });

    it("should throw when scopes are null or undefined", async () => {
        const provider = new ManagedIdentityTokenProvider();
        await expect(provider.getAccessTokenAsync(null as unknown as string[])).rejects.toThrow("At least one scope must be provided.");
    });

    it("should throw when credential returns null token", async () => {
        mockGetToken.mockResolvedValueOnce(null);
        const provider = new ManagedIdentityTokenProvider();
        await expect(provider.getAccessTokenAsync(["scope"])).rejects.toThrow("Failed to acquire access token.");
    });

    it("should return the token string when credential succeeds", async () => {
        mockGetToken.mockResolvedValueOnce({ token: "issued-token", expiresOnTimestamp: Date.now() + 3600_000 });
        const provider = new ManagedIdentityTokenProvider();
        const token = await provider.getAccessTokenAsync(["scope"]);
        expect(token).toBe("issued-token");
        expect(mockGetToken).toHaveBeenCalledWith(["scope"]);
    });
});
