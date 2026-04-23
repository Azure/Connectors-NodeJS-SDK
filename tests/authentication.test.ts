// Copyright (c) Microsoft Corporation.  All rights reserved.

import { ConnectionStringTokenProvider } from "../src/azure-workflows-connectors-sdk/authentication";

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
