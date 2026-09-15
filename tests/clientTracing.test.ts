// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import { createHttpHeaders } from "@azure/core-rest-pipeline";
import type { HttpClient, PipelineRequest, PipelineResponse } from "@azure/core-rest-pipeline";
import { useInstrumenter } from "@azure/core-tracing";
import type {
    Instrumenter,
    InstrumenterSpanOptions,
    SpanStatus,
    TracingContext,
    TracingSpan,
} from "@azure/core-tracing";
import { ConnectorClientBase } from "../src/azureConnectors/clientBase.ts";
import type { ConnectorOperationOptions } from "../src/azureConnectors/options.ts";

class TestTracingContext implements TracingContext {
    public readonly lineageId: symbol;

    private readonly values = new Map<symbol, unknown>();

    public constructor(lineageId = Symbol("tracing-context")) {
        this.lineageId = lineageId;
    }

    public setValue(key: symbol, value: unknown): TracingContext {
        const context = new TestTracingContext(this.lineageId);
        for (const [existingKey, existingValue] of this.values) {
            context.values.set(existingKey, existingValue);
        }

        context.values.set(key, value);
        return context;
    }

    public getValue(key: symbol): unknown {
        return this.values.get(key);
    }

    public deleteValue(key: symbol): TracingContext {
        const context = new TestTracingContext(this.lineageId);
        for (const [existingKey, existingValue] of this.values) {
            if (existingKey !== key) {
                context.values.set(existingKey, existingValue);
            }
        }

        return context;
    }
}

class TestSpan implements TracingSpan {
    public status: SpanStatus | undefined;
    public ended = false;

    public setStatus(status: SpanStatus): void {
        this.status = status;
    }

    public setAttribute(): void {
    }

    public end(): void {
        this.ended = true;
    }

    public recordException(): void {
    }

    public isRecording(): boolean {
        return true;
    }
}

class TestInstrumenter implements Instrumenter {
    public readonly spans = new Array<{
        name: string;
        options: InstrumenterSpanOptions;
        parentContext: TracingContext | undefined;
        tracingContext: TracingContext;
        span: TestSpan;
    }>();

    private activeContext: TracingContext | undefined;

    public startSpan(name: string, options: InstrumenterSpanOptions): { span: TracingSpan; tracingContext: TracingContext } {
        const span = new TestSpan();
        const tracingContext = new TestTracingContext();
        this.spans.push({
            name,
            options,
            parentContext: options.tracingContext ?? this.activeContext,
            tracingContext,
            span,
        });
        return { span, tracingContext };
    }

    public withContext<CallbackArgs extends unknown[], Callback extends (...args: CallbackArgs) => ReturnType<Callback>>(
        _context: TracingContext,
        callback: Callback,
        ...callbackArgs: CallbackArgs
    ): ReturnType<Callback> {
        const previousContext = this.activeContext;
        this.activeContext = _context;
        try {
            const result = callback(...callbackArgs);
            if (result instanceof Promise) {
                return result.finally(() => {
                    this.activeContext = previousContext;
                }) as ReturnType<Callback>;
            }

            this.activeContext = previousContext;
            return result;
        } catch (error) {
            this.activeContext = previousContext;
            throw error;
        }
    }

    public parseTraceparentHeader(): TracingContext | undefined {
        return undefined;
    }

    public createRequestHeaders(): Record<string, string> {
        return {};
    }
}

class TestHttpClient implements HttpClient {
    public request: PipelineRequest | undefined;

    public constructor(private readonly status: number) {
    }

    public async sendRequest(request: PipelineRequest): Promise<PipelineResponse> {
        this.request = request;
        return {
            request,
            status: this.status,
            headers: createHttpHeaders({ "x-test-response": "response-value" }),
            bodyAsText: this.status < 300 ? "{}" : "failure body",
        };
    }
}

class TestClient extends ConnectorClientBase {
    public get connectorName(): string {
        return "test";
    }

    public async getItem(options: ConnectorOperationOptions = {}): Promise<void> {
        await this.sendWithTracingAsync<void>(
            "TestClient.getItem",
            "GetItem",
            "GET",
            this.resolveUrl("/items/customer-id?sig=secret"),
            undefined,
            options,
        );
    }
}

function createCredential(): TokenCredential {
    return {
        getToken: async () => ({ token: "token", expiresOnTimestamp: Number.MAX_SAFE_INTEGER }),
    };
}

describe("ConnectorClientBase tracing", () => {
    afterEach(() => {
        useInstrumenter(new TestInstrumenter());
    });

    it("should create a public operation span and pass its context to the HTTP span", async () => {
        const instrumenter = new TestInstrumenter();
        useInstrumenter(instrumenter);
        const httpClient = new TestHttpClient(200);
        const client = new TestClient("https://example.com/runtime", createCredential(), {
            httpClient,
            retryOptions: { maxRetries: 0 },
        });

        await client.getItem();

        expect(instrumenter.spans.map(span => span.name)).toEqual([
            "TestClient.getItem",
            "HTTP GET",
        ]);
        expect((instrumenter.spans[1].parentContext as TestTracingContext).lineageId)
            .toBe((instrumenter.spans[0].tracingContext as TestTracingContext).lineageId);
        expect(instrumenter.spans.every(entry => entry.span.ended)).toBe(true);
    });

    it("should mark the operation span failed when a connector response is unsuccessful", async () => {
        const instrumenter = new TestInstrumenter();
        useInstrumenter(instrumenter);
        const httpClient = new TestHttpClient(500);
        const client = new TestClient("https://example.com/runtime", createCredential(), {
            httpClient,
            retryOptions: { maxRetries: 0 },
        });

        await expect(client.getItem()).rejects.toMatchObject({
            name: "ConnectorError",
            statusCode: 500,
        });

        expect(instrumenter.spans[0].span.status).toMatchObject({ status: "error" });
    });
});
