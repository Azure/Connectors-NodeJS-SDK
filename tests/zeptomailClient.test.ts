// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { ConnectorError } from "../src/azureConnectors/connectorError.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";
import {
    ReplyToAddress,
    SendMailInput,
    SendTemplateMailInput,
    ZeptomailClient,
} from "../src/generated/ZeptomailExtensions.ts";

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/zeptomail/connection";

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

describe("Zoho ZeptoMail generated client", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST template mail with mixed merge values and reply-to wire names", async () => {
        const response = { message: "accepted" };
        mockFetchResponse(response);
        const model: SendTemplateMailInput = {
            mailagent_key: "agent",
            mail_template_key: "template",
            from: { "from-detail": { address: "sender@example.com" }, name: "Sender" },
            merge_key_detail: [{ key: "customer", value: "Ada", rank: 2 }],
            reply_to: [{ address: "reply@example.com", name: "Reply" }],
        };
        const client = new ZeptomailClient(TestConnectionUrl, createMockCredential());

        const result = await client.sendTemplateMailAsync(model);

        expect(result).toEqual(response);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/v1.0/email/template`);
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body)).toEqual(model);
    });

    it("should GET processed emails with required and boolean query parameters", async () => {
        const response = { data: [] };
        mockFetchResponse(response);
        const client = new ZeptomailClient(TestConnectionUrl, createMockCredential());

        const result = await client.getProcessedEmailsAsync(
            "agent+key",
            "Quarterly report",
            "sender@example.com",
            "recipient@example.com",
            "2026-09-01/00:00",
            "2026-09-02/00:00",
            "request/42",
            true,
            false,
        );

        expect(result).toEqual(response);
        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(
            `${TestConnectionUrl}/v1.0/email?mailagent_key=agent%2Bkey&subject=Quarterly%20report` +
            "&from=sender%40example.com&to=recipient%40example.com" +
            "&date_from=2026-09-01%2F00%3A00&date_to=2026-09-02%2F00%3A00" +
            "&request_id=request%2F42&is_hb=true&is_sb=false",
        );
        expect(init.method).toBe("GET");
    });

    it("should expose ConnectorError details for a non-OK response", async () => {
        mockFetchError(422, "Invalid template payload");
        const client = new ZeptomailClient(TestConnectionUrl, createMockCredential());

        try {
            await client.sendTemplateMailAsync({
                mailagent_key: "agent",
                mail_template_key: "template",
                from: { "from-detail": { address: "sender@example.com" }, name: "Sender" },
            });
            throw new Error("Expected ConnectorError to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorError);
            const connectorError = error as ConnectorError;
            expect(connectorError.connectorName).toBe("zeptomail");
            expect(connectorError.operation).toBe("POST /v1.0/email/template");
            expect(connectorError.statusCode).toBe(422);
            expect(connectorError.responseBody).toBe("Invalid template payload");
        }
    });

    it("should construct and register the client", () => {
        const client = new ZeptomailClient(TestConnectionUrl, createMockCredential());

        expect(client.connectorName).toBe("zeptomail");
        expect(ConnectorNames.ZohoZeptoMail).toBe("zeptomail");
        expect(availableConnectors).toContain("zeptomail");
    });

    it("should preserve the corrected reply-to model in both request types", () => {
        const replyToAddress: ReplyToAddress = { address: "reply@example.com", name: "Reply" };
        const sendMail: Pick<SendMailInput, "reply_to"> = { reply_to: [replyToAddress] };
        const sendTemplateMail: Pick<SendTemplateMailInput, "reply_to"> = { reply_to: [replyToAddress] };

        expect(JSON.parse(JSON.stringify({ sendMail, sendTemplateMail }))).toEqual({
            sendMail: { reply_to: [{ address: "reply@example.com", name: "Reply" }] },
            sendTemplateMail: { reply_to: [{ address: "reply@example.com", name: "Reply" }] },
        });
    });
});
