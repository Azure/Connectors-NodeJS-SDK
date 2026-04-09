/**
 * @fileoverview Comprehensive tests for ConnectorResponse
 */

import { ConnectorResponse } from '../../src/sdk/base/connectorResponse';
import { AxiosResponse } from 'axios';

describe('ConnectorResponse', () => {
  describe('Constructor', () => {
    it('should create response with all parameters', () => {
      const data = { id: 1, name: 'test' };
      const status = 200;
      const statusText = 'OK';
      const headers = { 'content-type': 'application/json' };
      const rawResponse = { config: { method: 'GET' } } as AxiosResponse;

      const response = new ConnectorResponse(data, status, statusText, headers, rawResponse);

      expect(response.data).toEqual(data);
      expect(response.status).toBe(status);
      expect(response.statusText).toBe(statusText);
      expect(response.headers).toEqual(headers);
      expect(response.rawResponse).toBe(rawResponse);
    });

    it('should handle null data', () => {
      const response = new ConnectorResponse(null, 204, 'No Content', {}, {} as any);
      expect(response.data).toBeNull();
      expect(response.status).toBe(204);
    });

    it('should handle undefined data', () => {
      const response = new ConnectorResponse(undefined, 200, 'OK', {}, {} as any);
      expect(response.data).toBeUndefined();
    });

    it('should handle empty headers object', () => {
      const response = new ConnectorResponse({}, 200, 'OK', {}, {} as any);
      expect(response.headers).toEqual({});
    });

    it('should handle complex data structures', () => {
      const complexData = {
        users: [
          { id: 1, name: 'John', roles: ['admin', 'user'] },
          { id: 2, name: 'Jane', roles: ['user'] }
        ],
        metadata: {
          total: 2,
          page: 1,
          timestamp: new Date('2024-04-10T10:00:00Z')
        },
        settings: {
          enabled: true,
          config: { timeout: 5000, retries: 3 }
        }
      };

      const response = new ConnectorResponse(complexData, 200, 'OK', {}, {} as any);
      expect(response.data).toEqual(complexData);
      expect(response.data.users).toHaveLength(2);
      expect(response.data.metadata.total).toBe(2);
    });
  });

  describe('Generic Type Support', () => {
    interface User {
      id: number;
      name: string;
      email: string;
    }

    it('should support typed data with interfaces', () => {
      const userData: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      };

      const response = new ConnectorResponse<User>(userData, 200, 'OK', {}, {} as any);

      expect(response.data.id).toBe(1);
      expect(response.data.name).toBe('John Doe');
      expect(response.data.email).toBe('john@example.com');
    });

    it('should support arrays of typed data', () => {
      const users: User[] = [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' }
      ];

      const response = new ConnectorResponse<User[]>(users, 200, 'OK', {}, {} as any);

      expect(response.data).toHaveLength(2);
      expect(response.data?.[0]?.name).toBe('John');
      expect(response.data?.[1]?.email).toBe('jane@example.com');
    });

    it('should support Buffer data for binary responses', () => {
      const binaryData = Buffer.from('binary file content');
      const response = new ConnectorResponse<Buffer>(binaryData, 200, 'OK', {}, {} as any);

      expect(response.data).toBeInstanceOf(Buffer);
      expect(response.data.toString()).toBe('binary file content');
    });

    it('should support string data', () => {
      const textData = 'Plain text response';
      const response = new ConnectorResponse<string>(textData, 200, 'OK', {}, {} as any);

      expect(response.data).toBe('Plain text response');
      expect(typeof response.data).toBe('string');
    });

    it('should support number data', () => {
      const numberData = 42;
      const response = new ConnectorResponse<number>(numberData, 200, 'OK', {}, {} as any);

      expect(response.data).toBe(42);
      expect(typeof response.data).toBe('number');
    });

    it('should support boolean data', () => {
      const booleanData = true;
      const response = new ConnectorResponse<boolean>(booleanData, 200, 'OK', {}, {} as any);

      expect(response.data).toBe(true);
      expect(typeof response.data).toBe('boolean');
    });
  });

  describe('Status Code Handling', () => {
    it('should handle successful status codes', () => {
      const successCodes = [200, 201, 202, 204];
      successCodes.forEach(code => {
        const response = new ConnectorResponse({}, code, 'Success', {}, {} as any);
        expect(response.status).toBe(code);
      });
    });

    it('should handle client error status codes', () => {
      const clientErrorCodes = [400, 401, 403, 404, 422, 429];
      clientErrorCodes.forEach(code => {
        const response = new ConnectorResponse({}, code, 'Client Error', {}, {} as any);
        expect(response.status).toBe(code);
      });
    });

    it('should handle server error status codes', () => {
      const serverErrorCodes = [500, 501, 502, 503, 504];
      serverErrorCodes.forEach(code => {
        const response = new ConnectorResponse({}, code, 'Server Error', {}, {} as any);
        expect(response.status).toBe(code);
      });
    });

    it('should handle zero status code', () => {
      const response = new ConnectorResponse({}, 0, 'Network Error', {}, {} as any);
      expect(response.status).toBe(0);
    });

    it('should handle negative status codes', () => {
      const response = new ConnectorResponse({}, -1, 'Invalid Status', {}, {} as any);
      expect(response.status).toBe(-1);
    });
  });

  describe('Headers Handling', () => {
    it('should handle standard HTTP headers', () => {
      const headers = {
        'content-type': 'application/json',
        'content-length': '1024',
        'authorization': 'Bearer token123',
        'cache-control': 'no-cache',
        'x-custom-header': 'custom-value'
      };

      const response = new ConnectorResponse({}, 200, 'OK', headers, {} as any);
      expect(response.headers).toEqual(headers);
    });

    it('should handle headers with special characters', () => {
      const headers = {
        'x-unicode-header': 'värde with ñáéíóú',
        'x-emoji-header': 'value with 🚀⚡',
        'x-chinese-header': '中文值',
        'x-arabic-header': 'قيمة عربية'
      };

      const response = new ConnectorResponse({}, 200, 'OK', headers, {} as any);
      expect(response.headers).toEqual(headers);
    });

    it('should handle empty header values', () => {
      const headers = {
        'empty-header': '',
        'null-header': null as any,
        'undefined-header': undefined as any
      };

      const response = new ConnectorResponse({}, 200, 'OK', headers, {} as any);
      expect(response.headers).toEqual(headers);
    });

    it('should handle numeric header values', () => {
      const headers = {
        'numeric-header': 123 as any,
        'float-header': 12.34 as any,
        'boolean-header': true as any
      };

      const response = new ConnectorResponse({}, 200, 'OK', headers, {} as any);
      expect(response.headers).toEqual(headers);
    });
  });

  describe('Raw Response Handling', () => {
    it('should preserve complete raw response', () => {
      const rawResponse: AxiosResponse = {
        data: { original: 'data' },
        status: 200,
        statusText: 'OK',
        headers: { 'original-header': 'value' },
        config: {
          method: 'GET',
          url: '/api/test',
          headers: { 'request-header': 'value' }
        } as any,
        request: { path: '/api/test' }
      };

      const response = new ConnectorResponse(
        { processed: 'data' },
        201,
        'Created',
        { 'new-header': 'value' },
        rawResponse
      );

      expect(response.rawResponse).toBe(rawResponse);
      expect(response.rawResponse.config.method).toBe('GET');
      expect(response.rawResponse.data.original).toBe('data');
      
      // Verify that processed data is different from raw data
      expect(response.data).not.toEqual(response.rawResponse.data);
    });

    it('should handle null raw response', () => {
      const response = new ConnectorResponse({}, 200, 'OK', {}, null as any);
      expect(response.rawResponse).toBeNull();
    });

    it('should handle undefined raw response', () => {
      const response = new ConnectorResponse({}, 200, 'OK', {}, undefined as any);
      expect(response.rawResponse).toBeUndefined();
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle very large response data', () => {
      const largeData = {
        items: new Array(10000).fill({ id: 1, data: 'x'.repeat(1000) }),
        metadata: { total: 10000 }
      };

      const response = new ConnectorResponse(largeData, 200, 'OK', {}, {} as any);
      expect(response.data.items).toHaveLength(10000);
      expect(response.data.metadata.total).toBe(10000);
    });

    it('should handle deeply nested objects', () => {
      const deepData: any = { level: 0 };
      let current = deepData;
      
      // Create 100 levels of nesting
      for (let i = 1; i <= 100; i++) {
        current.next = { level: i };
        current = current.next;
      }

      const response = new ConnectorResponse(deepData, 200, 'OK', {}, {} as any);
      expect(response.data.level).toBe(0);
      
      // Navigate to level 50
      let navigator = response.data;
      for (let i = 0; i < 50; i++) {
        navigator = navigator.next;
      }
      expect(navigator.level).toBe(50);
    });

    it('should handle circular references in data', () => {
      const circularData: any = { name: 'root' };
      circularData.self = circularData;
      circularData.child = { name: 'child', parent: circularData };

      const response = new ConnectorResponse(circularData, 200, 'OK', {}, {} as any);
      expect(response.data.name).toBe('root');
      expect(response.data.self).toBe(response.data);
      expect(response.data.child.parent).toBe(response.data);
    });

    it('should handle special JavaScript values', () => {
      const specialData = {
        infinity: Infinity,
        negativeInfinity: -Infinity,
        notANumber: NaN,
        date: new Date('2024-04-10T10:00:00Z'),
        regex: /test pattern/gi,
        function: function() { return 'test'; }
      };

      const response = new ConnectorResponse(specialData, 200, 'OK', {}, {} as any);
      expect(response.data.infinity).toBe(Infinity);
      expect(response.data.negativeInfinity).toBe(-Infinity);
      expect(Number.isNaN(response.data.notANumber)).toBe(true);
      expect(response.data.date).toBeInstanceOf(Date);
      expect(response.data.regex).toBeInstanceOf(RegExp);
      expect(typeof response.data.function).toBe('function');
    });

    it('should maintain reference semantics for data objects', () => {
      const originalData = { value: 'original' };
      const originalHeaders = { 'original': 'header' };
      
      const response = new ConnectorResponse(originalData, 200, 'OK', originalHeaders, {} as any);
      
      // Verify initial state
      expect(response.data.value).toBe('original');
      expect(response.status).toBe(200);
      expect(response.headers['original']).toBe('header');
      
      // JavaScript objects are passed by reference, so modifying the original 
      // data object will affect the response data (this is expected behavior)
      originalData.value = 'modified';
      expect(response.data.value).toBe('modified'); // This is expected behavior
      
      // However, response properties themselves cannot be reassigned
      const originalDataRef = response.data;
      const originalStatusRef = response.status;
      const originalHeadersRef = response.headers;
      
      // These should remain the same references even if we try to modify
      expect(response.data).toBe(originalDataRef);
      expect(response.status).toBe(originalStatusRef);
      expect(response.headers).toBe(originalHeadersRef);
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should enforce type safety at compile time', () => {
      interface ApiResponse {
        success: boolean;
        message: string;
        code: number;
      }

      const apiData: ApiResponse = {
        success: true,
        message: 'Operation completed',
        code: 1001
      };

      const response = new ConnectorResponse<ApiResponse>(apiData, 200, 'OK', {}, {} as any);
      
      // TypeScript should provide intellisense and type checking for these properties
      expect(response.data.success).toBe(true);
      expect(response.data.message).toBe('Operation completed');
      expect(response.data.code).toBe(1001);
      
      // These should be type-safe at compile time
      expect(typeof response.data.success).toBe('boolean');
      expect(typeof response.data.message).toBe('string');
      expect(typeof response.data.code).toBe('number');
    });
  });
});