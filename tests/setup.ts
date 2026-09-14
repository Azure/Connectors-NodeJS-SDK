// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { HttpClient, PipelineResponse } from "@azure/core-rest-pipeline";

jest.mock("@azure/core-rest-pipeline", () => {
    const pipeline = jest.requireActual<typeof import("@azure/core-rest-pipeline")>(
        "@azure/core-rest-pipeline",
    );

    return {
        ...pipeline,
        createDefaultHttpClient: (): HttpClient => ({
            sendRequest: async request => {
                const response = await global.fetch(request.url, {
                    method: request.method,
                    headers: request.headers.toJSON({ preserveCase: true }),
                    body: request.body as RequestInit["body"],
                    signal: request.abortSignal as AbortSignal | undefined,
                });
                const headers = pipeline.createHttpHeaders();
                response.headers.forEach((value, name) => headers.set(name, value));

                return {
                    request,
                    status: response.status,
                    headers,
                    bodyAsText: await response.text(),
                } satisfies PipelineResponse;
            },
        }),
    };
});