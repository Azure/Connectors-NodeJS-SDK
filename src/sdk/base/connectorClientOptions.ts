/**
 * @fileoverview Configuration options for connector clients
 */

/**
 * Configuration options for connector clients.
 */
export class ConnectorClientOptions {
    /**
     * The base URL for the connector API.
     * Defaults to the standard Logic Apps connector endpoint.
     */
    public baseUrl?: string;

    /**
     * Request timeout in milliseconds.
     * Defaults to 30 seconds.
     */
    public timeout?: number = 30000;

    /**
     * Maximum number of retry attempts for failed requests.
     * Defaults to 3.
     */
    public maxRetryAttempts?: number = 3;

    /**
     * Retry delay in milliseconds.
     * Defaults to 1 second.
     */
    public retryDelayMs?: number = 1000;

    /**
     * Whether to use exponential backoff for retries.
     * Defaults to true.
     */
    public useExponentialBackoff?: boolean = true;

    /**
     * Initial retry delay in milliseconds for exponential backoff.
     * Defaults to 500ms.
     */
    public initialRetryDelayMs?: number = 500;

    /**
     * User agent string to include in requests.
     */
    public userAgent?: string = 'Azure-Connectors-NodeJS-SDK/1.0.0';

    /**
     * Additional headers to include in all requests.
     */
    public defaultHeaders?: Record<string, string>;

    /**
     * Whether to enable detailed logging.
     * Defaults to false.
     */
    public enableLogging?: boolean = false;

    /**
     * Custom HTTP agent options.
     */
    public httpAgentOptions?: any;

    constructor(options?: Partial<ConnectorClientOptions>) {
        if (options) {
            Object.assign(this, options);
        }
    }
}