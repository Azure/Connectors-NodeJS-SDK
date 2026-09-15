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
    private static readonly RetryLoggingPolicyName = "connectorRetryLoggingPolicy";
    private static readonly SafeHttpMethods = new Set<HttpMethods>(["GET", "HEAD", "OPTIONS", "TRACE"]);

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
     * @param body Optional request body (will be JSON-serialized).
     * @param abortSignal Optional abort signal for caller-initiated cancellation.
    * @param tracingOptions Optional tracing context for the HTTP span.
     */
    public async sendAsync<TValue = unknown>(
        method: string,
        url: string,
        scopes?: string[],
        body?: unknown,
        abortSignal?: AbortSignalLike,
        tracingOptions?: OperationTracingOptions,
    ): Promise<ConnectorResponse<TValue>> {
        const effectiveScopes = scopes ?? ConnectorHttpClient.ApiHubScopes;
        const logUrl = ConnectorHttpClient.sanitizeUrlForLogging(url);
        const startTime = Date.now();
        logger.info(`Request ${method} ${logUrl}`);
        const request = createPipelineRequest({
            url,
            method: method as HttpMethods,
            body: body === undefined ? undefined : JSON.stringify(body),
            abortSignal,
            tracingOptions,
        });
        request.headers.set("Accept", "application/json, */*;q=0.8");

        if (body !== undefined) {
            request.headers.set("Content-Type", "application/json");
        }

        try {
            const response = await this.getPipeline(effectiveScopes).sendRequest(this.httpClient, request);
            const responseMessage = `Response ${response.status} ${method} ${logUrl} (${Date.now() - startTime}ms)`;
            if (response.status >= 200 && response.status < 300) {
                logger.info(responseMessage);
            } else {
                logger.error(responseMessage);
            }

            return ConnectorHttpClient.createConnectorResponse<TValue>(response);
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
            this.pipelines.set(key, pipeline);
        }

        return pipeline;
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

    private static createConnectorResponse<TValue>(response: PipelineResponse): ConnectorResponse<TValue> {
        const text = response.bodyAsText ?? "";
        let value: TValue | undefined;
        if (text) {
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
}
