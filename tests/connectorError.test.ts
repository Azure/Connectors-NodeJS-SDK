// Copyright (c) Microsoft Corporation.  All rights reserved.

import { RestError } from "@azure/core-rest-pipeline";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";

describe("ConnectorError", () => {
    it("should create an Azure Core error with connector details", () => {
        const error = new ConnectorError("office365", "GET /v2/Mail", 404, "Not found");

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(RestError);
        expect(error).toBeInstanceOf(ConnectorError);
        expect(error.name).toBe("ConnectorError");
        expect(error.connectorName).toBe("office365");
        expect(error.operation).toBe("GET /v2/Mail");
        expect(error.statusCode).toBe(404);
        expect(error.responseBody).toBe("Not found");
        expect(error.message).toContain("[office365]");
        expect(error.message).toContain("GET /v2/Mail");
        expect(error.message).toContain("404");
    });

    it("should truncate long response bodies in the message", () => {
        const longBody = "x".repeat(3000);
        const error = new ConnectorError("office365", "POST /api", 500, longBody);

        expect(error.message).toContain("...[truncated]");
        expect(error.responseBody).toBe(longBody);
    });

    it("should handle an empty response body", () => {
        const error = new ConnectorError("office365", "DELETE /item", 500, "");

        expect(error.message).toContain("DELETE /item");
        expect(error.responseBody).toBe("");
    });
});