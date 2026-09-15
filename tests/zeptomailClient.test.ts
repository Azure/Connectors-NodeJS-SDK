// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
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

describe("Zoho ZeptoMail generated client", () => {
    it("should preserve mixed merge values", () => {
        const model: SendTemplateMailInput = {
            mailagent_key: "agent",
            mail_template_key: "template",
            from: { "from-detail": { address: "sender@example.com" }, name: "Sender" },
            merge_key_detail: [{ key: "customer", value: "Ada", rank: 2 }],
        };

        const mergeItem: Record<string, unknown> | undefined = model.merge_key_detail?.[0];
        expect(mergeItem).toEqual({ key: "customer", value: "Ada", rank: 2 });
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
