// Copyright (c) Microsoft Corporation.  All rights reserved.

import { createHttpHeaders, createPipelineRequest } from "@azure/core-rest-pipeline";
import type { PipelineResponse } from "@azure/core-rest-pipeline";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";

function createResponse(status: number, bodyAsText: string): PipelineResponse {
    const request = createPipelineRequest({
        url: "https://example.com/v2/Mail?messageId=customer-message-id",
        method: "GET",
        headers: createHttpHeaders({ "x-request-header": "request-value" }),
    });
    return {
        request,
        status,
        headers: createHttpHeaders({ "x-response-header": "response-value" }),
        bodyAsText,
    };
}

describe("ConnectorError", () => {
    it("should create an Azure Core error with connector details", () => {
        const response = createResponse(404, "Not found");
        const error = new ConnectorError("office365", "GetMail", response);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ConnectorError);
        expect(error.name).toBe("ConnectorError");
        expect(error.connectorName).toBe("office365");
        expect(error.operation).toBe("GetMail");
        expect(error.statusCode).toBe(404);
        expect(error.responseBody).toBe("Not found");
        expect(error.request).toBe(response.request);
        expect(error.request.url).toContain("messageId=customer-message-id");
        expect(error.request.headers.get("x-request-header")).toBe("request-value");
        expect(error.response).toBe(response);
        expect(error.response.headers.get("x-response-header")).toBe("response-value");
        expect(error.message).toContain("[office365]");
        expect(error.message).toContain("GetMail");
        expect(error.message).toContain("404");
    });

    it("should truncate long response bodies in the message", () => {
        const longBody = "x".repeat(3000);
        const error = new ConnectorError("office365", "CreateItem", createResponse(500, longBody));

        expect(error.message).toContain("...[truncated]");
        expect(error.responseBody).toBe(longBody);
    });

    it("should handle an empty response body", () => {
        const error = new ConnectorError("office365", "DeleteItem", createResponse(500, ""));

        expect(error.message).toContain("DeleteItem");
        expect(error.responseBody).toBe("");
    });
});