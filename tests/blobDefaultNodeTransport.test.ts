// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import type { PipelinePolicy } from "@azure/core-rest-pipeline";
import { createServer } from "node:http";
import { UniversalPrintClient } from "../src/generated/UniversalPrintExtensions.ts";

// NOTE(swapnil-nagar): Azure Core forbids bearer tokens on HTTP; bypass only auth and allow local HTTP for the real Node transport.
jest.mock("@azure/core-rest-pipeline", () => {
    const pipeline = jest.requireActual<typeof import("@azure/core-rest-pipeline")>("@azure/core-rest-pipeline");
    return {
        ...pipeline,
        bearerTokenAuthenticationPolicy: (): PipelinePolicy => ({
            name: "local-test-auth-bypass",
            sendRequest: (request, next) => {
                request.allowInsecureConnection = true;
                return next(request);
            },
        }),
    };
});

const credential: TokenCredential = {
    getToken: async () => ({ token: "local-test-token", expiresOnTimestamp: Number.MAX_SAFE_INTEGER }),
};

describe("generated Blob uploads with the default Node transport", () => {
    it.each([
        ["authored PDF type", "application/pdf", "application/pdf"],
        ["missing media type", "", "application/octet-stream"],
    ] as const)("sends exact binary bytes with %s", async (_scenario, mediaType, expectedContentType) => {
        const bytes = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, 0x00, 0xff]);
        let receivedBody: Buffer | undefined;
        let receivedContentType: string | undefined;
        const server = createServer((request, response) => {
            const chunks: Buffer[] = [];
            request.on("data", (chunk: Buffer) => chunks.push(chunk));
            request.on("end", () => {
                receivedBody = Buffer.concat(chunks);
                receivedContentType = request.headers["content-type"];
                response.writeHead(204).end();
            });
        });
        server.requestTimeout = 5_000;
        server.setTimeout(5_000);
        await new Promise<void>((resolve, reject) => {
            server.once("error", reject);
            server.listen(0, "127.0.0.1", resolve);
        });

        const fetchSpy = jest.spyOn(globalThis, "fetch");
        try {
            const address = server.address();
            if (!address || typeof address === "string") {
                throw new Error("Local HTTP server did not bind to a TCP port.");
            }

            const client = new UniversalPrintClient(`http://127.0.0.1:${address.port}/connections/local`, credential);
            await client.printFile(new Blob([bytes], { type: mediaType }), "printer", "file.pdf", {
                abortSignal: AbortSignal.timeout(5_000),
            });

            expect(receivedBody).toEqual(Buffer.from(bytes));
            expect(receivedContentType).toBe(expectedContentType);
            expect(fetchSpy).not.toHaveBeenCalled();
        } finally {
            fetchSpy.mockRestore();
            server.closeAllConnections();
            await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
        }
    }, 12_000);
});
