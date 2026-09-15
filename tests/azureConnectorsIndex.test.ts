// Copyright (c) Microsoft Corporation.  All rights reserved.

import * as sdk from "../src/azureConnectors/index.ts";

describe("azureConnectors index exports", () => {
    it("should export runtime SDK members", () => {
        expect(sdk.ConnectorClientBase).toBeDefined();
        expect(sdk.DefaultConnectorClientOptions).toBeDefined();
        expect(sdk.ManagedIdentityTokenProvider).toBeDefined();
        expect(sdk.ConnectionStringTokenProvider).toBeDefined();
        expect(sdk.ConnectorError).toBeDefined();
        expect(sdk.ConnectorHttpClient).toBeDefined();
        expect(sdk.logger).toBeDefined();
    });

    it("should include expected runtime export keys", () => {
        expect(Object.keys(sdk)).toEqual(
            expect.arrayContaining([
                "ConnectorClientBase",
                "DefaultConnectorClientOptions",
                "ManagedIdentityTokenProvider",
                "ConnectionStringTokenProvider",
                "ConnectorError",
                "ConnectorHttpClient",
                "logger",
            ]),
        );
    });
});
