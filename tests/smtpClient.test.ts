// Copyright (c) Microsoft Corporation.  All rights reserved.

import {
    SmtpClient,
    Email,
    Attachment,
} from "../src/generated/SmtpExtensions.ts";
import { ConnectorException } from "../src/azureConnectors/connectorException.ts";
import { TokenProvider } from "../src/azureConnectors/authentication.ts";
import { ConnectorNames } from "../src/generated/connectorNames.ts";
import { availableConnectors } from "../src/generated/ManagedConnectors.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TestConnectionUrl = "https://connection-runtime.azure.com/apim/smtp/abc123";

function createMockTokenProvider(): TokenProvider {
    return {
        getAccessTokenAsync: async () => "mock-bearer-token",
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

const _email: Email = {
    From: "sender@contoso.com",
    To: "recipient@contoso.com",
    Subject: "Test Email",
    Body: "Hello from SMTP",
};

const _attachment: Attachment = {
    FileName: "report.pdf",
    ContentData: "base64data==",
    ContentType: "application/pdf",
    ContentTransferEncoding: "base64",
};

// ──────────────────────────────────────────────
// Runtime tests
// ──────────────────────────────────────────────

describe("SmtpClient — constructor", () => {
    it("should construct with valid options", () => {
        const client = new SmtpClient(TestConnectionUrl, createMockTokenProvider());
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(SmtpClient);
    });

    it("should strip trailing slashes from connection URL", () => {
        const client = new SmtpClient(TestConnectionUrl + "///", createMockTokenProvider());
        expect(client).toBeDefined();
    });

    it("should construct with an empty connection URL", () => {
        const client = new SmtpClient("", createMockTokenProvider());
        expect(client).toBeDefined();
    });

    it("should throw on null connection URL", () => {
        expect(() => new SmtpClient(null as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });

    it("should throw on undefined connection URL", () => {
        expect(() => new SmtpClient(undefined as unknown as string, createMockTokenProvider()))
            .toThrow("Parameter 'connectionRuntimeUrl' cannot be null or undefined.");
    });
});

describe("SmtpClient — sendEmailAsync", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should POST to /SendEmailV3 with correct body and headers", async () => {
        mockFetchResponse(null);

        const client = new SmtpClient(TestConnectionUrl, createMockTokenProvider());
        const input: Email = {
            From: "sender@contoso.com",
            To: "recipient@contoso.com",
            Subject: "Test",
            Body: "Hello",
        };

        await client.sendEmailAsync(input);

        expect(global.fetch).toHaveBeenCalledTimes(1);

        const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe(`${TestConnectionUrl}/SendEmailV3`);
        expect(init.method).toBe("POST");
        expect(init.headers["Authorization"]).toBe("Bearer mock-bearer-token");
        expect(init.headers["Content-Type"]).toBe("application/json");
        expect(JSON.parse(init.body)).toEqual(input);
    });

    it("should send email with attachments", async () => {
        mockFetchResponse(null);

        const client = new SmtpClient(TestConnectionUrl, createMockTokenProvider());
        const input: Email = {
            From: "sender@contoso.com",
            To: "recipient@contoso.com",
            Subject: "With attachment",
            Body: "See attached",
            Attachments: [
                { FileName: "doc.pdf", ContentData: "base64==", ContentType: "application/pdf", ContentTransferEncoding: "base64" },
            ],
        };

        await client.sendEmailAsync(input);

        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(init.body);
        expect(body.Attachments).toHaveLength(1);
        expect(body.Attachments[0].FileName).toBe("doc.pdf");
    });

    it("should send email with CC and BCC", async () => {
        mockFetchResponse(null);

        const client = new SmtpClient(TestConnectionUrl, createMockTokenProvider());
        const input: Email = {
            From: "sender@contoso.com",
            To: "recipient@contoso.com",
            CC: "cc@contoso.com",
            Bcc: "bcc@contoso.com",
            Subject: "CC and BCC test",
            Body: "Hello",
        };

        await client.sendEmailAsync(input);

        const [, init] = (global.fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(init.body);
        expect(body.CC).toBe("cc@contoso.com");
        expect(body.Bcc).toBe("bcc@contoso.com");
    });
});

describe("SmtpClient — error handling", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw ConnectorException on non-OK response", async () => {
        mockFetchError(550, '{"error": "MailboxNotFound"}');

        const client = new SmtpClient(TestConnectionUrl, createMockTokenProvider());

        await expect(
            client.sendEmailAsync({
                From: "sender@contoso.com",
                To: "invalid@contoso.com",
                Subject: "Test",
                Body: "Hello",
            }),
        ).rejects.toThrow(ConnectorException);
    });

    it("should include status code and response body in error", async () => {
        const errorBody = '{"code": "AuthenticationRequired"}';
        mockFetchError(401, errorBody);

        const client = new SmtpClient(TestConnectionUrl, createMockTokenProvider());

        try {
            await client.sendEmailAsync({
                From: "sender@contoso.com",
                To: "recipient@contoso.com",
                Subject: "Test",
                Body: "Hello",
            });
            throw new Error("Expected ConnectorException to be thrown.");
        } catch (error) {
            expect(error).toBeInstanceOf(ConnectorException);
            const connectorError = error as ConnectorException;
            expect(connectorError.statusCode).toBe(401);
            expect(connectorError.responseBody).toBe(errorBody);
            expect(connectorError.operation).toContain("POST");
        }
    });
});

describe("Smtp — connector registry", () => {
    it("should have smtp in ConnectorNames", () => {
        expect(ConnectorNames.SMTP).toBe("smtp");
    });

    it("should include smtp in availableConnectors", () => {
        expect(availableConnectors).toContain("smtp");
    });
});
