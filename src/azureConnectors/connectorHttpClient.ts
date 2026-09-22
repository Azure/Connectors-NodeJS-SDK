// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * HTTP client for connector operations with retry and authentication.
 *
 * Uses the Azure Core REST pipeline for transport policies and diagnostics.
 */

import type { AbortSignalLike } from "@azure/abort-controller";
import type { TokenCredential } from "@azure/core-auth";
import type { OperationTracingOptions } from "@azure/core-tracing";
import {
    bearerTokenAuthenticationPolicy,
    createDefaultHttpClient,
    createPipelineFromOptions,
    createPipelineRequest,
    defaultRetryPolicy,
    logPolicyName,
} from "@azure/core-rest-pipeline";
import type {
    HttpClient,
    HttpMethods,
    Pipeline,
    PipelineOptions,
    PipelinePolicy,
    PipelineRequest,
    PipelineResponse,
} from "@azure/core-rest-pipeline";
import { logger } from "./logger.ts";
import type { ConnectorClientOptions } from "./options.ts";

/**
 * Represents a response from a connector operation.
 */
export interface ConnectorResponse<TValue = unknown> {
    /** The HTTP status code. */
    statusCode: number;

    /** The response headers. */
    headers: Record<string, string>;

    /** The response value. */
    value: TValue | undefined;

    /** The raw response text. */
    text: string;

    /** Check if the response indicates success. */
    isSuccessStatusCode: boolean;

    /** The complete pipeline response, including its originating request. */
    rawResponse: PipelineResponse;
}

/**
 * HTTP client for connector operations with retry and authentication.
 */
export class ConnectorHttpClient {
    private static readonly ApiHubScopes = ["https://apihub.azure.com/.default"];
    private static readonly DefaultMaxRetries = 3;
    private static readonly DefaultRetryPolicyName = "defaultRetryPolicy";
    private static readonly LoggingPolicyName = "connectorLoggingPolicy";
    private static readonly RedactedHeaderValue = "REDACTED";
    private static readonly RetryLoggingPolicyName = "connectorRetryLoggingPolicy";
    private static readonly SafeLoggedHeaderNames = new Set([
        "accept",
        "accept-encoding",
        "cache-control",
        "client-request-id",
        "connection",
        "content-length",
        "content-type",
        "date",
        "etag",
        "expires",
        "if-match",
        "if-modified-since",
        "if-none-match",
        "if-unmodified-since",
        "last-modified",
        "ms-cv",
        "pragma",
        "request-id",
        "retry-after",
        "return-client-request-id",
        "server",
        "traceparent",
        "transfer-encoding",
        "user-agent",
        "www-authenticate",
        "x-ms-client-request-id",
        "x-ms-correlation-request-id",
        "x-ms-request-id",
        "x-ms-return-client-request-id",
        "x-ms-useragent",
    ]);
    private static readonly SensitiveLoggedHeaderNames = new Set([
        "api-key",
        "authorization",
        "cookie",
        "proxy-authorization",
        "set-cookie",
        "x-api-key",
    ]);
    private static readonly SafeHttpMethods = new Set<HttpMethods>(["GET", "HEAD", "OPTIONS", "TRACE"]);
    private static readonly SuccessfulResponseStatusCodes = new Set(
        Array.from({ length: 100 }, (_value, index) => index + 200),
    );

    private readonly credential: TokenCredential;
    private readonly httpClient: HttpClient;
    private readonly pipelineOptions: PipelineOptions;
    private readonly pipelines = new Map<string, Pipeline>();
    private readonly retryUnsafeHttpMethods: boolean;

    /**
     * Initializes a ConnectorHttpClient.
     * @param credential The credential used for authentication.
     * @param options The client options.
     */
    constructor(credential: TokenCredential, options?: ConnectorClientOptions) {
        if (!credential) {
            throw new Error("credential cannot be null or undefined.");
        }

        this.credential = credential;
        this.httpClient = options?.httpClient ?? createDefaultHttpClient();
        this.retryUnsafeHttpMethods = options?.retryUnsafeHttpMethods ?? false;
        const pipelineOptions: ConnectorClientOptions = { ...options };
        delete pipelineOptions.baseUri;
        delete pipelineOptions.httpClient;
        delete pipelineOptions.retryUnsafeHttpMethods;
        this.pipelineOptions = pipelineOptions;
    }

    /**
     * Sends an HTTP request with authentication and retry.
     * @param method The HTTP method.
     * @param url The request URL.
     * @param scopes The authentication scopes. Defaults to API Hub scopes.
    * @param body Optional JSON or multipart form-data request body.
     * @param abortSignal Optional abort signal for caller-initiated cancellation.
    * @param tracingOptions Optional tracing context for the HTTP span.
    * @param requestHeaders Service-specific request headers.
    * @param responseAsBlob Whether successful response content should be returned as a Blob.
     */
    public async sendAsync<TValue = unknown>(
        method: string,
        url: string,
        scopes?: string[],
        body?: unknown,
        abortSignal?: AbortSignalLike,
        tracingOptions?: OperationTracingOptions,
        requestHeaders?: Readonly<Record<string, string>>,
        responseAsBlob = false,
    ): Promise<ConnectorResponse<TValue>> {
        const effectiveScopes = scopes ?? ConnectorHttpClient.ApiHubScopes;
        const logUrl = ConnectorHttpClient.sanitizeUrlForLogging(url);
        const isFormDataBody = typeof FormData !== "undefined" && body instanceof FormData;
        logger.info(`Request ${method} ${logUrl}`);
        const request = createPipelineRequest({
            url,
            method: method as HttpMethods,
            body: body === undefined
                ? undefined
                : isFormDataBody
                    ? body
                    : JSON.stringify(body),
            abortSignal,
            tracingOptions,
            streamResponseStatusCodes: responseAsBlob
                ? ConnectorHttpClient.SuccessfulResponseStatusCodes
                : undefined,
        });
        request.headers.set("Accept", "application/json, */*;q=0.8");

        if (body !== undefined && !isFormDataBody) {
            request.headers.set("Content-Type", "application/json");
        }

        for (const [name, value] of Object.entries(requestHeaders ?? {})) {
            request.headers.set(name, value);
        }

        try {
            const response = await this.getPipeline(effectiveScopes).sendRequest(this.httpClient, request);
            return await ConnectorHttpClient.createConnectorResponse<TValue>(response, responseAsBlob);
        } catch (error) {
            if (abortSignal?.aborted || error instanceof Error && error.name === "AbortError") {
                logger.info(`${method} ${logUrl} canceled`);
            } else {
                const errorName = error instanceof Error ? error.name : "UnknownError";
                logger.warning(`${method} ${logUrl} failed with ${errorName}`);
                if (error instanceof Error && error.stack) {
                    logger.verbose(ConnectorHttpClient.sanitizeStackForLogging(error));
                }
            }

            throw error;
        }
    }

    private getPipeline(scopes: string[]): Pipeline {
        const pipelineScopes = [...scopes];
        const key = JSON.stringify(pipelineScopes);
        let pipeline = this.pipelines.get(key);
        if (!pipeline) {
            pipeline = createPipelineFromOptions(this.pipelineOptions);
            pipeline.removePolicy({ name: logPolicyName });
            pipeline.removePolicy({ name: ConnectorHttpClient.DefaultRetryPolicyName });
            const retryPolicy = defaultRetryPolicy(this.pipelineOptions.retryOptions);
            pipeline.addPolicy(
                {
                    name: ConnectorHttpClient.DefaultRetryPolicyName,
                    sendRequest: (request, next) => this.retryUnsafeHttpMethods ||
                        ConnectorHttpClient.SafeHttpMethods.has(request.method)
                        ? retryPolicy.sendRequest(request, next)
                        : next(request),
                },
                { phase: "Retry" },
            );
            pipeline.addPolicy(
                ConnectorHttpClient.createRetryLoggingPolicy(
                    this.pipelineOptions.retryOptions?.maxRetries ?? ConnectorHttpClient.DefaultMaxRetries,
                ),
                { afterPhase: "Retry" },
            );
            pipeline.addPolicy(
                bearerTokenAuthenticationPolicy({ credential: this.credential, scopes: pipelineScopes }),
                { phase: "Sign" },
            );
            pipeline.addPolicy(
                ConnectorHttpClient.createLoggingPolicy(),
                { afterPhase: "Sign" },
            );
            this.pipelines.set(key, pipeline);
        }

        return pipeline;
    }

    private static createLoggingPolicy(): PipelinePolicy {
        return {
            name: ConnectorHttpClient.LoggingPolicyName,
            sendRequest: async (request, next): Promise<PipelineResponse> => {
                const logUrl = ConnectorHttpClient.sanitizeUrlForLogging(request.url);
                const startTime = Date.now();
                logger.info(
                    `Request headers: ${ConnectorHttpClient.formatHeadersForLogging(
                        request.headers.toJSON(),
                        ConnectorHttpClient.SafeLoggedHeaderNames,
                    )}`,
                );
                const response = await next(request);
                logger.info(`Response ${response.status} ${request.method} ${logUrl} (${Date.now() - startTime}ms)`);
                logger.info(
                    `Response headers: ${ConnectorHttpClient.formatHeadersForLogging(
                        response.headers.toJSON(),
                        ConnectorHttpClient.SafeLoggedHeaderNames,
                    )}`,
                );
                return response;
            },
        };
    }

    private static createRetryLoggingPolicy(maxRetries: number): PipelinePolicy {
        const attempts = new WeakMap<PipelineRequest, { count: number; completedAt: number }>();
        return {
            name: ConnectorHttpClient.RetryLoggingPolicyName,
            sendRequest: async (request, next): Promise<PipelineResponse> => {
                const state = attempts.get(request) ?? { count: 0, completedAt: Date.now() };
                if (state.count > 0) {
                    logger.info(
                        `Retry ${state.count}/${maxRetries} for ${request.method} ` +
                        `${ConnectorHttpClient.sanitizeUrlForLogging(request.url)} after ${Date.now() - state.completedAt}ms`,
                    );
                }

                state.count++;
                attempts.set(request, state);
                try {
                    return await next(request);
                } finally {
                    state.completedAt = Date.now();
                }
            },
        };
    }

    private static formatHeadersForLogging(
        headers: Record<string, string>,
        allowedHeaderNames: ReadonlySet<string>,
    ): string {
        const sanitizedHeaders = Object.fromEntries(
            Object.entries(headers)
                .sort(([leftName], [rightName]) => leftName.localeCompare(rightName))
                .map(([headerName, headerValue]) => {
                    const normalizedHeaderName = headerName.toLowerCase();
                    const canLogValue = allowedHeaderNames.has(normalizedHeaderName) &&
                        !ConnectorHttpClient.SensitiveLoggedHeaderNames.has(normalizedHeaderName);
                    return [
                        headerName,
                        canLogValue ? headerValue : ConnectorHttpClient.RedactedHeaderValue,
                    ];
                }),
        );
        return JSON.stringify(sanitizedHeaders);
    }

    private static sanitizeUrlForLogging(url: string): string {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.origin;
        } catch {
            return "<invalid URL>";
        }
    }

    private static sanitizeStackForLogging(error: Error): string {
        const stackLines = error.stack?.split("\n") ?? [];
        if (stackLines.length === 0) {
            return error.name;
        }

        stackLines[0] = error.name;
        return stackLines
            .join("\n")
            .replace(/https?:\/\/[^\s)'"\]]+/g, url => ConnectorHttpClient.sanitizeUrlForLogging(url));
    }

    private static async createConnectorResponse<TValue>(
        response: PipelineResponse,
        responseAsBlob: boolean,
    ): Promise<ConnectorResponse<TValue>> {
        const text = response.bodyAsText ?? "";
        let value: TValue | undefined;
        if (responseAsBlob && response.status >= 200 && response.status < 300) {
            value = await ConnectorHttpClient.createResponseBlob(response) as TValue | undefined;
        } else if (text) {
            try {
                value = JSON.parse(text) as TValue;
            } catch {
                value = undefined;
            }
        }

        return {
            statusCode: response.status,
            headers: response.headers.toJSON(),
            value,
            text,
            isSuccessStatusCode: response.status >= 200 && response.status < 300,
            rawResponse: response,
        };
    }

    private static async createResponseBlob(response: PipelineResponse): Promise<Blob | undefined> {
        if (response.blobBody) {
            return await response.blobBody;
        }

        const stream = response.browserStreamBody ?? response.readableStreamBody;
        if (stream) {
            return await new Response(stream as ConstructorParameters<typeof Response>[0], {
                headers: response.headers.toJSON(),
            }).blob();
        }

        return response.bodyAsText === undefined || response.bodyAsText === null
            ? undefined
            : new Blob([response.bodyAsText], {
                type: response.headers.get("Content-Type") ?? "application/octet-stream",
            });
    }
}
