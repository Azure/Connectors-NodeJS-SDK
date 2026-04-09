/**
 * @fileoverview Comprehensive tests for ConnectorClientOptions
 */

import { ConnectorClientOptions } from '../../src/sdk/base/connectorClientOptions';

describe('ConnectorClientOptions', () => {
  describe('Constructor with Default Values', () => {
    it('should create options with all default values when no config provided', () => {
      const options = new ConnectorClientOptions();
      
      expect(options.baseUrl).toBeUndefined(); // No default value in source
      expect(options.timeout).toBe(30000);
      expect(options.enableLogging).toBe(false);
      expect(options.userAgent).toContain('Azure-Connectors-NodeJS-SDK');
      expect(options.maxRetryAttempts).toBe(3);
      expect(options.retryDelayMs).toBe(1000);
    });

    it('should create options with empty config object', () => {
      const options = new ConnectorClientOptions({});
      
      expect(options.baseUrl).toBeUndefined(); // No default value in source
      expect(options.timeout).toBe(30000);
      expect(options.enableLogging).toBe(false);
    });
  });

  describe('Constructor with Custom Values', () => {
    it('should create options with custom base URL', () => {
      const customBaseUrl = 'https://custom-api.example.com';
      const options = new ConnectorClientOptions({ baseUrl: customBaseUrl });
      
      expect(options.baseUrl).toBe(customBaseUrl);
      expect(options.timeout).toBe(30000); // Default value
    });

    it('should create options with custom timeout', () => {
      const customTimeout = 60000;
      const options = new ConnectorClientOptions({ timeout: customTimeout });
      
      expect(options.timeout).toBe(customTimeout);
      expect(options.baseUrl).toBeUndefined(); // No default value
    });

    it('should create options with logging enabled', () => {
      const options = new ConnectorClientOptions({ enableLogging: true });
      
      expect(options.enableLogging).toBe(true);
    });

    it('should create options with custom user agent', () => {
      const customUserAgent = 'MyApp/1.0 Custom-Agent';
      const options = new ConnectorClientOptions({ userAgent: customUserAgent });
      
      expect(options.userAgent).toBe(customUserAgent);
    });

    it('should create options with custom default headers', () => {
      const customHeaders = {
        'X-Custom-Header': 'custom-value',
        'Authorization': 'Bearer custom-token'
      };
      const options = new ConnectorClientOptions({ defaultHeaders: customHeaders });
      
      expect(options.defaultHeaders).toEqual(customHeaders);
    });

    it('should create options with custom HTTP agent options', () => {
      const customAgentOptions = {
        keepAlive: true,
        maxSockets: 50,
        timeout: 120000
      };
      const options = new ConnectorClientOptions({ httpAgentOptions: customAgentOptions });
      
      expect(options.httpAgentOptions).toEqual(customAgentOptions);
    });

    it('should create options with all custom values', () => {
      const config = {
        baseUrl: 'https://custom.api.com',
        timeout: 45000,
        enableLogging: true,
        userAgent: 'CustomSDK/2.0',
        defaultHeaders: { 'X-API-Key': 'secret123' },
        httpAgentOptions: { keepAlive: true }
      };

      const options = new ConnectorClientOptions(config);
      
      expect(options.baseUrl).toBe(config.baseUrl);
      expect(options.timeout).toBe(config.timeout);
      expect(options.enableLogging).toBe(config.enableLogging);
      expect(options.userAgent).toBe(config.userAgent);
      expect(options.defaultHeaders).toEqual(config.defaultHeaders);
      expect(options.httpAgentOptions).toEqual(config.httpAgentOptions);
    });
  });

  describe('URL Validation and Normalization', () => {
    it('should handle URLs with trailing slashes', () => {
      const urlWithSlash = 'https://api.example.com/';
      const options = new ConnectorClientOptions({ baseUrl: urlWithSlash });
      
      expect(options.baseUrl).toBe(urlWithSlash);
    });

    it('should handle URLs without trailing slashes', () => {
      const urlWithoutSlash = 'https://api.example.com';
      const options = new ConnectorClientOptions({ baseUrl: urlWithoutSlash });
      
      expect(options.baseUrl).toBe(urlWithoutSlash);
    });

    it('should handle URLs with paths', () => {
      const urlWithPath = 'https://api.example.com/v1/connectors';
      const options = new ConnectorClientOptions({ baseUrl: urlWithPath });
      
      expect(options.baseUrl).toBe(urlWithPath);
    });

    it('should handle URLs with query parameters', () => {
      const urlWithQuery = 'https://api.example.com/api?version=1.0';
      const options = new ConnectorClientOptions({ baseUrl: urlWithQuery });
      
      expect(options.baseUrl).toBe(urlWithQuery);
    });

    it('should handle localhost URLs', () => {
      const localhostUrl = 'http://localhost:3000/api';
      const options = new ConnectorClientOptions({ baseUrl: localhostUrl });
      
      expect(options.baseUrl).toBe(localhostUrl);
    });

    it('should handle IP address URLs', () => {
      const ipUrl = 'https://192.168.1.100:8080/api';
      const options = new ConnectorClientOptions({ baseUrl: ipUrl });
      
      expect(options.baseUrl).toBe(ipUrl);
    });

    it('should handle URLs with special characters', () => {
      const specialUrl = 'https://api-test.example.com/v1_0/connectors-api';
      const options = new ConnectorClientOptions({ baseUrl: specialUrl });
      
      expect(options.baseUrl).toBe(specialUrl);
    });
  });

  describe('Timeout Validation', () => {
    it('should handle zero timeout', () => {
      const options = new ConnectorClientOptions({ timeout: 0 });
      expect(options.timeout).toBe(0);
    });

    it('should handle very small timeout', () => {
      const options = new ConnectorClientOptions({ timeout: 1 });
      expect(options.timeout).toBe(1);
    });

    it('should handle very large timeout', () => {
      const largeTimeout = 999999999;
      const options = new ConnectorClientOptions({ timeout: largeTimeout });
      expect(options.timeout).toBe(largeTimeout);
    });

    it('should handle negative timeout', () => {
      const options = new ConnectorClientOptions({ timeout: -1000 });
      expect(options.timeout).toBe(-1000);
    });

    it('should handle floating point timeout', () => {
      const options = new ConnectorClientOptions({ timeout: 30000.5 });
      expect(options.timeout).toBe(30000.5);
    });
  });

  describe('Headers Handling', () => {
    it('should handle empty headers object', () => {
      const options = new ConnectorClientOptions({ defaultHeaders: {} });
      expect(options.defaultHeaders).toEqual({});
    });

    it('should handle headers with various value types', () => {
      const headers = {
        'string-header': 'string-value',
        'number-header': 123 as any,
        'boolean-header': true as any,
        'undefined-header': undefined as any,
        'null-header': null as any
      };
      const options = new ConnectorClientOptions({ defaultHeaders: headers });
      expect(options.defaultHeaders).toEqual(headers);
    });

    it('should handle headers with special characters', () => {
      const headers = {
        'X-Custom-Header': 'value with spaces',
        'X-Unicode-Header': 'värde with ñáéíóú',
        'X-Emoji-Header': 'value with 🚀⚡',
        'X-Quote-Header': 'value with "quotes" and \'apostrophes\''
      };
      const options = new ConnectorClientOptions({ defaultHeaders: headers });
      expect(options.defaultHeaders).toEqual(headers);
    });

    it('should handle case-sensitive header names', () => {
      const headers = {
        'Content-Type': 'application/json',
        'content-type': 'text/plain',
        'CONTENT-TYPE': 'application/xml'
      };
      const options = new ConnectorClientOptions({ defaultHeaders: headers });
      expect(options.defaultHeaders).toEqual(headers);
      expect(Object.keys(options.defaultHeaders!)).toHaveLength(3);
    });

    it('should handle very long header values', () => {
      const longValue = 'x'.repeat(10000);
      const headers = { 'X-Long-Header': longValue };
      const options = new ConnectorClientOptions({ defaultHeaders: headers });
      expect(options.defaultHeaders!['X-Long-Header']).toBe(longValue);
    });

    it('should handle large number of headers', () => {
      const manyHeaders: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        manyHeaders[`X-Header-${i}`] = `value-${i}`;
      }
      const options = new ConnectorClientOptions({ defaultHeaders: manyHeaders });
      expect(Object.keys(options.defaultHeaders!)).toHaveLength(100);
      expect(options.defaultHeaders!['X-Header-50']).toBe('value-50');
    });
  });

  describe('HTTP Agent Options', () => {
    it('should handle common agent options', () => {
      const agentOptions = {
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 256,
        maxFreeSockets: 256,
        timeout: 60000,
        freeSocketTimeout: 30000
      };
      const options = new ConnectorClientOptions({ httpAgentOptions: agentOptions });
      expect(options.httpAgentOptions).toEqual(agentOptions);
    });

    it('should handle SSL/TLS options', () => {
      const sslOptions = {
        rejectUnauthorized: true,
        cert: 'certificate-content',
        key: 'private-key-content',
        ca: ['ca-certificate-1', 'ca-certificate-2']
      };
      const options = new ConnectorClientOptions({ httpAgentOptions: sslOptions });
      expect(options.httpAgentOptions).toEqual(sslOptions);
    });

    it('should handle proxy options', () => {
      const proxyOptions = {
        proxy: {
          host: 'proxy.example.com',
          port: 8080,
          auth: { username: 'proxyuser', password: 'proxypass' }
        }
      };
      const options = new ConnectorClientOptions({ httpAgentOptions: proxyOptions });
      expect(options.httpAgentOptions).toEqual(proxyOptions);
    });

    it('should handle empty agent options', () => {
      const options = new ConnectorClientOptions({ httpAgentOptions: {} });
      expect(options.httpAgentOptions).toEqual({});
    });

    it('should handle null agent options', () => {
      const options = new ConnectorClientOptions({ httpAgentOptions: null as any });
      expect(options.httpAgentOptions).toBeNull();
    });
  });

  describe('User Agent Handling', () => {
    it('should handle empty user agent', () => {
      const options = new ConnectorClientOptions({ userAgent: '' });
      expect(options.userAgent).toBe('');
    });

    it('should handle user agent with version numbers', () => {
      const userAgent = 'MySDK/1.2.3 (Windows; .NET 6.0)';
      const options = new ConnectorClientOptions({ userAgent });
      expect(options.userAgent).toBe(userAgent);
    });

    it('should handle user agent with special characters', () => {
      const userAgent = 'SDK/1.0 (+https://github.com/example/sdk; contact@example.com)';
      const options = new ConnectorClientOptions({ userAgent });
      expect(options.userAgent).toBe(userAgent);
    });

    it('should handle very long user agent', () => {
      const longUserAgent = 'VeryLongUserAgentString'.repeat(100);
      const options = new ConnectorClientOptions({ userAgent: longUserAgent });
      expect(options.userAgent).toBe(longUserAgent);
    });
  });

  describe('Boolean Options', () => {
    it('should handle enableLogging as false', () => {
      const options = new ConnectorClientOptions({ enableLogging: false });
      expect(options.enableLogging).toBe(false);
    });

    it('should handle enableLogging as true', () => {
      const options = new ConnectorClientOptions({ enableLogging: true });
      expect(options.enableLogging).toBe(true);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle undefined config', () => {
      const options = new ConnectorClientOptions(undefined as any);
      expect(options.baseUrl).toBeUndefined(); // No default value
      expect(options.timeout).toBe(30000);
    });

    it('should handle null config', () => {
      const options = new ConnectorClientOptions(null as any);
      expect(options.baseUrl).toBeUndefined(); // No default value
      expect(options.timeout).toBe(30000);
    });

    it('should handle config with only some properties', () => {
      const partialConfig = {
        baseUrl: 'https://custom.api.com',
        enableLogging: true
        // Missing other properties
      };
      const options = new ConnectorClientOptions(partialConfig);
      expect(options.baseUrl).toBe('https://custom.api.com');
      expect(options.enableLogging).toBe(true);
      expect(options.timeout).toBe(30000); // Default
    });

    it('should handle config with extra properties', () => {
      const configWithExtra = {
        baseUrl: 'https://api.example.com',
        timeout: 45000,
        extraProperty: 'should be ignored',
        anotherExtra: 123
      } as any;
      const options = new ConnectorClientOptions(configWithExtra);
      expect(options.baseUrl).toBe('https://api.example.com');
      expect(options.timeout).toBe(45000);
      expect((options as any).extraProperty).toBe('should be ignored'); // Object.assign copies all properties
    });

    it('should create new instance each time', () => {
      const config = { baseUrl: 'https://api.example.com' };
      const options1 = new ConnectorClientOptions(config);
      const options2 = new ConnectorClientOptions(config);
      
      expect(options1).not.toBe(options2);
      expect(options1.baseUrl).toBe(options2.baseUrl);
    });

    it('should share references when using same config object', () => {
      const sharedHeaders = { 'X-Shared': 'value' };
      const config1 = { defaultHeaders: sharedHeaders };
      const config2 = { defaultHeaders: sharedHeaders };
      
      const options1 = new ConnectorClientOptions(config1);
      const options2 = new ConnectorClientOptions(config2);
      
      // Modify one instance's headers through shared reference
      options1.defaultHeaders!['X-Modified'] = 'modified-value';
      
      // Other instance will be affected since they share the same object reference
      expect(options2.defaultHeaders!['X-Modified']).toBe('modified-value');
    });
  });

  describe('Memory and Performance', () => {
    it('should handle creation of many instances', () => {
      const instances: ConnectorClientOptions[] = [];
      
      for (let i = 0; i < 1000; i++) {
        instances.push(new ConnectorClientOptions({
          baseUrl: `https://api-${i}.example.com`,
          timeout: 1000 + i
        }));
      }
      
      expect(instances).toHaveLength(1000);
      expect(instances[999]?.baseUrl).toBe('https://api-999.example.com');
      expect(instances[999]?.timeout).toBe(1999);
    });

    it('should handle very large configuration objects', () => {
      const largeHeaders: Record<string, string> = {};
      for (let i = 0; i < 10000; i++) {
        largeHeaders[`Header-${i}`] = `Value-${i}`;
      }

      const largeConfig = {
        baseUrl: 'https://large-config.example.com',
        defaultHeaders: largeHeaders,
        httpAgentOptions: {
          keepAlive: true,
          largeOption: new Array(1000).fill('data').join('')
        }
      };

      const options = new ConnectorClientOptions(largeConfig);
      expect(Object.keys(options.defaultHeaders!)).toHaveLength(10000);
      expect(options.defaultHeaders!['Header-5000']).toBe('Value-5000');
    });
  });

  describe('Mutability', () => {
    it('should allow modification of options after creation', () => {
      const options = new ConnectorClientOptions({
        baseUrl: 'https://api.example.com',
        timeout: 30000
      });

      // Modify properties (current implementation allows this)
      options.baseUrl = 'https://modified.example.com';
      options.timeout = 60000;

      // Properties are modifiable in current implementation
      expect(options.baseUrl).toBe('https://modified.example.com');
      expect(options.timeout).toBe(60000);
    });
  });
});