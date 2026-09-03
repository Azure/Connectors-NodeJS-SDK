// Copyright (c) Microsoft Corporation.  All rights reserved.

import { DefaultConnectorClientOptions } from "../src/azureConnectors/options.ts";
import type { ConnectorClientOptions } from "../src/azureConnectors/options.ts";

describe("ConnectorClientOptions", () => {
    it("should default the connector base URI", () => {
        expect(DefaultConnectorClientOptions).toEqual({ baseUri: "" });
    });

    it("should accept standard pipeline options", () => {
        const options: ConnectorClientOptions = {
            retryOptions: {
                maxRetries: 4,
                retryDelayInMs: 1000,
                maxRetryDelayInMs: 60000,
            },
            telemetryOptions: {
                clientRequestIdHeaderName: "x-custom-request-id",
            },
        };

        expect(options.retryOptions?.maxRetries).toBe(4);
        expect(options.telemetryOptions?.clientRequestIdHeaderName).toBe("x-custom-request-id");
    });
});
