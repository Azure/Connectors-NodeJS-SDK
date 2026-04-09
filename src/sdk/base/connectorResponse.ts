/**
 * @fileoverview Response wrapper for connector API calls
 */

/**
 * Represents a response from a connector API call.
 */
export class ConnectorResponse<T = any> {
    /**
     * The response data.
     */
    public readonly data: T;

    /**
     * The HTTP status code.
     */
    public readonly status: number;

    /**
     * The HTTP status text.
     */
    public readonly statusText: string;

    /**
     * The response headers.
     */
    public readonly headers: Record<string, string>;

    /**
     * Whether the request was successful.
     */
    public readonly success: boolean;

    /**
     * Raw response body (if available).
     */
    public readonly rawResponse?: any;

    constructor(
        data: T,
        status: number,
        statusText: string,
        headers: Record<string, string>,
        rawResponse?: any
    ) {
        this.data = data;
        this.status = status;
        this.statusText = statusText;
        this.headers = headers;
        this.success = status >= 200 && status < 300;
        this.rawResponse = rawResponse;
    }
}