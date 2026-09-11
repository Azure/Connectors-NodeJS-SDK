// Copyright (c) Microsoft Corporation.  All rights reserved.

/**
 * HTTP client for connector operations with retry and authentication.
 *
 * Uses the Azure Core REST pipeline for transport policies and diagnostics.
 */

import type { AbortSignalLike } from "@azure/abort-controller";
import type { TokenCredential } from "@azure/core-auth";
import {
    bearerTokenAuthenticationPolicy,
    createDefaultHttpClient,
    createPipelineFromOptions,
    createPipelineRequest,
    defaultRetryPolicy,
} from "@azure/core-rest-pipeline";
import type {
    HttpClient,
    HttpMethods,
    Pipeline,
    PipelineOptions,
    PipelineResponse,
} from "@azure/core-rest-pipeline";
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
}

/**
 * HTTP client for connector operations with retry and authentication.
 */
export class ConnectorHttpClient {
    private static readonly ApiHubScopes = ["https://apihub.azure.com/.default"];
    private static readonly DefaultRetryPolicyName = "defaultRetryPolicy";
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
     */
    public async sendAsync<TValue = unknown>(
        method: string,
        url: string,
        scopes?: string[],
        body?: unknown,
        abortSignal?: AbortSignalLike,
    ): Promise<ConnectorResponse<TValue>> {
        const effectiveScopes = scopes ?? ConnectorHttpClient.ApiHubScopes;
        const request = createPipelineRequest({
            url,
            method: method as HttpMethods,
            body: body === undefined ? undefined : JSON.stringify(body),
            abortSignal,
        });
        request.headers.set("Accept", "application/json, */*;q=0.8");

        if (body !== undefined) {
            request.headers.set("Content-Type", "application/json");
        }

        const response = await this.getPipeline(effectiveScopes).sendRequest(this.httpClient, request);
        return ConnectorHttpClient.createConnectorResponse<TValue>(response);
    }

    private getPipeline(scopes: string[]): Pipeline {
        const pipelineScopes = [...scopes];
        const key = JSON.stringify(pipelineScopes);
        let pipeline = this.pipelines.get(key);
        if (!pipeline) {
            pipeline = createPipelineFromOptions(this.pipelineOptions);
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
                bearerTokenAuthenticationPolicy({ credential: this.credential, scopes: pipelineScopes }),
                { phase: "Sign" },
            );
            this.pipelines.set(key, pipeline);
        }

        return pipeline;
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
        };
    }
}
