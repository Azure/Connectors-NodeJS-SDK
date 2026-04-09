/**
 * @fileoverview Comprehensive tests for exception classes
 */

import {
  ConnectorException,
  Office365ConnectorException,
  SharepointonlineConnectorException,
  TeamsConnectorException,
  ExceptionExtensions
} from '../../src/sdk/utils/exceptions';

describe('Exception Classes', () => {
  describe('ConnectorException', () => {
    it('should create exception with message only', () => {
      const message = 'Test error message';
      const exception = new ConnectorException(message);

      expect(exception.message).toBe(message);
      expect(exception.name).toBe('ConnectorException');
      expect(exception.statusCode).toBe(0);
      expect(exception.statusText).toBe('');
      expect(exception.responseBody).toBeNull();
      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(ConnectorException);
    });

    it('should create exception with all parameters', () => {
      const message = 'Detailed error message';
      const statusCode = 400;
      const statusText = 'Bad Request';
      const responseBody = { error: 'Invalid input', details: 'Field X is required' };

      const exception = new ConnectorException(message, statusCode, statusText, responseBody);

      expect(exception.message).toBe(message);
      expect(exception.statusCode).toBe(statusCode);
      expect(exception.statusText).toBe(statusText);
      expect(exception.responseBody).toEqual(responseBody);
    });

    it('should handle null and undefined response body', () => {
      const nullException = new ConnectorException('Test', 500, 'Error', null);
      const undefinedException = new ConnectorException('Test', 500, 'Error', undefined);

      expect(nullException.responseBody).toBeNull();
      expect(undefinedException.responseBody).toBeNull(); // JavaScript converts undefined to null in these cases
    });

    it('should handle complex response body objects', () => {
      const complexResponseBody = {
        error: {
          code: 'INVALID_REQUEST',
          message: 'The request is invalid',
          details: [
            { field: 'email', issue: 'required' },
            { field: 'name', issue: 'too_long' }
          ]
        },
        timestamp: new Date().toISOString(),
        requestId: 'req-12345'
      };

      const exception = new ConnectorException('Complex error', 422, 'Unprocessable Entity', complexResponseBody);
      expect(exception.responseBody).toEqual(complexResponseBody);
    });

    it('should maintain proper prototype chain', () => {
      const exception = new ConnectorException('Test');
      expect(exception instanceof ConnectorException).toBe(true);
      expect(exception instanceof Error).toBe(true);
    });

    it('should handle empty string parameters', () => {
      const exception = new ConnectorException('', 0, '', '');
      expect(exception.message).toBe('');
      expect(exception.statusText).toBe('');
      expect(exception.responseBody).toBe('');
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A very long error message that could potentially cause issues with string handling '.repeat(100);
      const exception = new ConnectorException(longMessage);
      expect(exception.message).toBe(longMessage);
    });

    it('should handle special characters in error details', () => {
      const message = 'Error with special chars: áéíóú ñ ¿¡ €';
      const statusText = 'Status with émojis 🚨⚠️';
      const responseBody = { 
        description: 'Response with unicode: ñáéíóú 中文 العربية',
        emoji: '🔥💥⚡'
      };

      const exception = new ConnectorException(message, 500, statusText, responseBody);
      expect(exception.message).toBe(message);
      expect(exception.statusText).toBe(statusText);
      expect(exception.responseBody).toEqual(responseBody);
    });
  });

  describe('Office365ConnectorException', () => {
    it('should create Office365 exception with correct name', () => {
      const exception = new Office365ConnectorException('Office365 error');
      expect(exception.name).toBe('Office365ConnectorException');
      expect(exception).toBeInstanceOf(Office365ConnectorException);
      expect(exception).toBeInstanceOf(ConnectorException);
      expect(exception).toBeInstanceOf(Error);
    });

    it('should handle Office365-specific scenarios', () => {
      const office365Error = {
        error: {
          code: 'EmailQuotaExceeded',
          message: 'Daily email quota exceeded'
        }
      };

      const exception = new Office365ConnectorException(
        'Failed to send email',
        429,
        'Too Many Requests',
        office365Error
      );

      expect(exception.responseBody.error.code).toBe('EmailQuotaExceeded');
    });

    it('should maintain prototype chain for instanceof checks', () => {
      const exception = new Office365ConnectorException('Test');
      expect(exception instanceof Office365ConnectorException).toBe(true);
      expect(exception instanceof ConnectorException).toBe(true);
      expect(exception instanceof Error).toBe(true);
    });
  });

  describe('SharepointonlineConnectorException', () => {
    it('should create SharePoint exception with correct name', () => {
      const exception = new SharepointonlineConnectorException('SharePoint error');
      expect(exception.name).toBe('SharepointonlineConnectorException');
      expect(exception).toBeInstanceOf(SharepointonlineConnectorException);
      expect(exception).toBeInstanceOf(ConnectorException);
    });

    it('should handle SharePoint-specific scenarios', () => {
      const sharePointError = {
        error: {
          code: 'FileNotFound',
          message: 'The requested file does not exist'
        }
      };

      const exception = new SharepointonlineConnectorException(
        'File operation failed',
        404,
        'Not Found',
        sharePointError
      );

      expect(exception.responseBody.error.code).toBe('FileNotFound');
    });
  });

  describe('TeamsConnectorException', () => {
    it('should create Teams exception with correct name', () => {
      const exception = new TeamsConnectorException('Teams error');
      expect(exception.name).toBe('TeamsConnectorException');
      expect(exception).toBeInstanceOf(TeamsConnectorException);
      expect(exception).toBeInstanceOf(ConnectorException);
    });

    it('should handle Teams-specific scenarios', () => {
      const teamsError = {
        error: {
          code: 'ChannelNotFound',
          message: 'The specified channel does not exist'
        }
      };

      const exception = new TeamsConnectorException(
        'Message send failed',
        404,
        'Not Found',
        teamsError
      );

      expect(exception.responseBody.error.code).toBe('ChannelNotFound');
    });
  });

  describe('ExceptionExtensions', () => {
    describe('isFatal()', () => {
      it('should return false for null/undefined errors', () => {
        expect(ExceptionExtensions.isFatal(null)).toBe(false);
        expect(ExceptionExtensions.isFatal(undefined)).toBe(false);
      });

      it('should return false for empty objects', () => {
        expect(ExceptionExtensions.isFatal({})).toBe(false);
      });

      it('should return false for standard errors', () => {
        expect(ExceptionExtensions.isFatal(new Error('Standard error'))).toBe(false);
        expect(ExceptionExtensions.isFatal(new ConnectorException('Connector error'))).toBe(false);
      });

      it('should handle string errors', () => {
        expect(ExceptionExtensions.isFatal('String error')).toBe(false);
      });

      it('should handle number errors', () => {
        expect(ExceptionExtensions.isFatal(500)).toBe(false);
        expect(ExceptionExtensions.isFatal(0)).toBe(false);
      });

      it('should handle boolean errors', () => {
        expect(ExceptionExtensions.isFatal(true)).toBe(false);
        expect(ExceptionExtensions.isFatal(false)).toBe(false);
      });

      it('should handle complex objects', () => {
        const complexError = {
          message: 'Complex error',
          stack: 'Error stack trace',
          details: [1, 2, 3]
        };
        expect(ExceptionExtensions.isFatal(complexError)).toBe(false);
      });
    });
  });

  describe('Error Serialization and JSON Handling', () => {
    it('should handle JSON serialization of exceptions', () => {
      const responseBody = { error: 'JSON error', code: 500 };
      const exception = new ConnectorException('Serialization test', 500, 'Error', responseBody);

      const serialized = JSON.stringify({
        message: exception.message,
        statusCode: exception.statusCode,
        statusText: exception.statusText,
        responseBody: exception.responseBody
      });

      const parsed = JSON.parse(serialized);
      expect(parsed.message).toBe('Serialization test');
      expect(parsed.responseBody.error).toBe('JSON error');
    });

    it('should handle circular references in response body gracefully', () => {
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj;

      // Should not throw when creating exception with circular reference
      expect(() => {
        const exception = new ConnectorException('Circular test', 500, 'Error', circularObj);
        expect(exception.responseBody).toBe(circularObj);
      }).not.toThrow();
    });
  });

  describe('Exception Stack Traces', () => {
    it('should preserve stack traces', () => {
      const exception = new ConnectorException('Stack trace test');
      expect(exception.stack).toBeDefined();
      expect(typeof exception.stack).toBe('string');
      expect(exception.stack!.includes('ConnectorException')).toBe(true);
    });

    it('should create different stack traces for different exceptions', () => {
      const exception1 = new ConnectorException('Error 1');
      const exception2 = new Office365ConnectorException('Error 2');

      expect(exception1.stack).not.toBe(exception2.stack);
    });
  });

  describe('Exception Inheritance Edge Cases', () => {
    it('should work correctly with try-catch blocks', () => {
      expect.assertions(3);

      try {
        throw new Office365ConnectorException('Test exception');
      } catch (error) {
        expect(error).toBeInstanceOf(Office365ConnectorException);
        expect(error).toBeInstanceOf(ConnectorException);
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should work with Promise rejections', async () => {
      const promise = Promise.reject(new TeamsConnectorException('Async error'));

      await expect(promise).rejects.toBeInstanceOf(TeamsConnectorException);
      await expect(promise).rejects.toBeInstanceOf(ConnectorException);
    });

    it('should handle exception chaining', () => {
      const originalError = new Error('Original error');
      const wrappedException = new ConnectorException(
        `Wrapped: ${originalError.message}`,
        500,
        'Internal Server Error',
        { originalError: originalError.message }
      );

      expect(wrappedException.message).toContain('Original error');
      expect(wrappedException.responseBody.originalError).toBe('Original error');
    });
  });

  describe('Memory Management', () => {
    it('should handle large response bodies without memory issues', () => {
      const largeArray = new Array(10000).fill('large data chunk');
      const largeResponseBody = {
        data: largeArray,
        metadata: { size: largeArray.length }
      };

      const exception = new ConnectorException('Large data test', 500, 'Error', largeResponseBody);
      // Body exceeds MAX_RESPONSE_BODY_LENGTH so it gets truncated to a string
      expect(typeof exception.responseBody).toBe('string');
      expect(exception.responseBody.endsWith('...[truncated]')).toBe(true);
      expect(exception.responseBody.length).toBeLessThanOrEqual(
        ConnectorException.MAX_RESPONSE_BODY_LENGTH + '...[truncated]'.length
      );
    });

    it('should create multiple exceptions without memory leaks', () => {
      const exceptions: ConnectorException[] = [];
      
      // Create many exceptions
      for (let i = 0; i < 1000; i++) {
        exceptions.push(new ConnectorException(`Error ${i}`, i, `Status ${i}`, { index: i }));
      }

      expect(exceptions.length).toBe(1000);
      expect(exceptions[999]?.message).toBe('Error 999');
      expect((exceptions[999]?.responseBody as any).index).toBe(999);
    });
  });
});