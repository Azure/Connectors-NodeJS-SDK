/**
 * @fileoverview Exception classes for connector operations
 */

/**
 * Base exception class for connector operations.
 */
export class ConnectorException extends Error {
    /**
     * Maximum length of response body stored in exception.
     */
    public static readonly MAX_RESPONSE_BODY_LENGTH = 2000;

    /**
     * The HTTP status code of the failed request.
     */
    public readonly statusCode: number;

    /**
     * The HTTP status text of the failed request.
     */
    public readonly statusText: string;

    /**
     * The response body from the failed request (truncated if too large).
     */
    public readonly responseBody: any;

    constructor(message: string, statusCode: number = 0, statusText: string = '', responseBody: any = null) {
        super(message);
        this.name = 'ConnectorException';
        this.statusCode = statusCode;
        this.statusText = statusText;
        this.responseBody = ConnectorException.truncateBody(responseBody);

        // Ensures proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, ConnectorException.prototype);
    }

    /**
     * Truncates response body if it exceeds maximum length.
     */
    private static truncateBody(body: any): any {
        if (body === null || body === undefined) {
            return body;
        }
        let bodyStr: string;
        try {
            bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        } catch {
            // Handle circular references or other serialization errors
            return body;
        }
        if (bodyStr.length <= ConnectorException.MAX_RESPONSE_BODY_LENGTH) {
            return body;
        }
        return bodyStr.substring(0, ConnectorException.MAX_RESPONSE_BODY_LENGTH) + '...[truncated]';
    }
}

/**
 * Exception thrown by Office 365 connector operations.
 */
export class Office365ConnectorException extends ConnectorException {
    constructor(message: string, statusCode: number = 0, statusText: string = '', responseBody: any = null) {
        super(message, statusCode, statusText, responseBody);
        this.name = 'Office365ConnectorException';
        Object.setPrototypeOf(this, Office365ConnectorException.prototype);
    }
}

/**
 * Exception thrown by SharePoint Online connector operations.
 */
export class SharepointonlineConnectorException extends ConnectorException {
    constructor(message: string, statusCode: number = 0, statusText: string = '', responseBody: any = null) {
        super(message, statusCode, statusText, responseBody);
        this.name = 'SharepointonlineConnectorException';
        Object.setPrototypeOf(this, SharepointonlineConnectorException.prototype);
    }
}

/**
 * Exception thrown by Teams connector operations.
 */
export class TeamsConnectorException extends ConnectorException {
    constructor(message: string, statusCode: number = 0, statusText: string = '', responseBody: any = null) {
        super(message, statusCode, statusText, responseBody);
        this.name = 'TeamsConnectorException';
        Object.setPrototypeOf(this, TeamsConnectorException.prototype);
    }
}

/**
 * Utility functions for exception handling.
 */
export class ExceptionExtensions {
    /**
     * Determines if an error is a fatal error that should not be caught.
     * @param error The error to check.
     */
    public static isFatal(error: any): boolean {
        if (!error) {
            return false;
        }

        // Consider out-of-memory and stack overflow as fatal
        if (error.name === 'RangeError' && error.message?.includes('Maximum call stack')) {
            return true;
        }

        // Consider syntax errors as fatal (should not occur in runtime)
        if (error.name === 'SyntaxError') {
            return true;
        }

        return false;
    }
}