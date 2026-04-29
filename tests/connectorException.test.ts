// Copyright (c) Microsoft Corporation.  All rights reserved.

import { ConnectorException } from "../src/azureConnectors/connectorException";

describe("ConnectorException", () => {
    it("should create error with correct properties", () => {
        const error = new ConnectorException("GET /v2/Mail", 404, "Not found");

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ConnectorException);
        expect(error.name).toBe("ConnectorException");
        expect(error.operation).toBe("GET /v2/Mail");
        expect(error.statusCode).toBe(404);
        expect(error.responseBody).toBe("Not found");
        expect(error.message).toContain("GET /v2/Mail");
        expect(error.message).toContain("404");
    });

    it("should truncate long response bodies in message", () => {
        const longBody = "x".repeat(3000);
        const error = new ConnectorException("POST /api", 500, longBody);

        expect(error.message).toContain("...[truncated]");
        expect(error.responseBody).toBe(longBody);
    });

    it("should handle empty response body", () => {
        const error = new ConnectorException("DELETE /item", 500, "");

        expect(error.message).toContain("DELETE /item");
        expect(error.responseBody).toBe("");
    });
});
