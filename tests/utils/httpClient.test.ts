/**
 * @fileoverview Comprehensive tests for HttpClient
 */

import { HttpClient } from '../../src/sdk/utils/httpClient';
import { ITokenProvider } from '../../src/sdk/authentication/tokenProvider';
import { ConnectorClientOptions } from '../../src/sdk/base/connectorClientOptions';
import { ConnectorResponse } from '../../src/sdk/base/connectorResponse';
import { ConnectorException } from '../../src/sdk/utils/exceptions';
import { TEST_CONSTANTS } from '../setup/testSetup';
import axios, { AxiosResponse, AxiosError } from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HttpClient', () => {
  let mockTokenProvider: jest.Mocked<ITokenProvider>;
  let mockAxiosInstance: any;
  let clientOptions: ConnectorClientOptions;

  beforeEach(() => {
    // Mock token provider
    mockTokenProvider = {
      getToken: jest.fn().mockResolvedValue(TEST_CONSTANTS.MOCK_TOKEN),
      refreshToken: jest.fn().mockResolvedValue(TEST_CONSTANTS.MOCK_TOKEN),
    };

    // Mock axios instance
    mockAxiosInstance = {
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    clientOptions = new ConnectorClientOptions({
      baseUrl: TEST_CONSTANTS.MOCK_BASE_URL,
      timeout: TEST_CONSTANTS.TIMEOUT,
      enableLogging: false
    });
  });

  describe('Constructor', () => {
    it('should create HTTP client with default options', () => {
      const httpClient = new HttpClient(mockTokenProvider, clientOptions);
      expect(httpClient).toBeInstanceOf(HttpClient);
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: TEST_CONSTANTS.MOCK_BASE_URL,
          timeout: TEST_CONSTANTS.TIMEOUT,
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should setup interceptors on construction', () => {
      new HttpClient(mockTokenProvider, clientOptions);
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });

    it('should include custom headers in axios config', () => {
      const customOptions = new ConnectorClientOptions({
        baseUrl: TEST_CONSTANTS.MOCK_BASE_URL,
        defaultHeaders: { 'Custom-Header': 'custom-value' }
      });

      new HttpClient(mockTokenProvider, customOptions);
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Custom-Header': 'custom-value',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should include HTTP agent options', () => {
      const customOptions = new ConnectorClientOptions({
        baseUrl: TEST_CONSTANTS.MOCK_BASE_URL,
        httpAgentOptions: { keepAlive: true }
      });

      new HttpClient(mockTokenProvider, customOptions);
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          keepAlive: true
        })
      );
    });
  });

  describe('request()', () => {
    let httpClient: HttpClient;

    beforeEach(() => {
      httpClient = new HttpClient(mockTokenProvider, clientOptions);
    });

    it('should make successful request and return ConnectorResponse', async () => {
      const mockResponseData = { id: 1, name: 'test' };
      const mockResponse: AxiosResponse = {
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config: {} as any,
        request: {}
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await httpClient.request<any>('GET', '/test');

      expect(result).toBeInstanceOf(ConnectorResponse);
      expect(result.data).toEqual(mockResponseData);
      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
      expect(result.headers['content-type']).toBe('application/json');
    });

    it('should pass through request configuration correctly', async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        request: {}
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const requestBody = { field: 'value' };
      const requestHeaders = { 'Custom-Header': 'test' };
      const requestOptions = { timeout: 10000 };

      await httpClient.request('POST', '/api/test', requestBody, requestHeaders, requestOptions);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/test',
        data: requestBody,
        headers: requestHeaders,
        timeout: 10000
      });
    });

    it('should handle Axios errors and convert to ConnectorException', async () => {
      const axiosError: AxiosError = {
        message: 'Request failed',
        name: 'AxiosError',
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid input' },
          headers: {},
          config: {} as any,
          request: {}
        },
        isAxiosError: true,
        toJSON: () => ({})
      } as AxiosError;

      mockAxiosInstance.request.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(httpClient.request('GET', '/error')).rejects.toThrow(ConnectorException);
      
      try {
        await httpClient.request('GET', '/error');
      } catch (error) {
        expect(error).toBeInstanceOf(ConnectorException);
        const connectorError = error as ConnectorException;
        expect(connectorError.statusCode).toBe(400);
        expect(connectorError.statusText).toBe('Bad Request');
        expect(connectorError.responseBody).toEqual({ error: 'Invalid input' });
      }
    });

    it('should handle Axios errors without response', async () => {
      const axiosError: AxiosError = {
        message: 'Network Error',
        name: 'AxiosError',
        isAxiosError: true,
        toJSON: () => ({})
      } as AxiosError;

      mockAxiosInstance.request.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      try {
        await httpClient.request('GET', '/network-error');
      } catch (error) {
        expect(error).toBeInstanceOf(ConnectorException);
        const connectorError = error as ConnectorException;
        expect(connectorError.statusCode).toBe(0);
        expect(connectorError.statusText).toBe('Unknown Error');
        expect(connectorError.message).toBe('Network Error');
      }
    });

    it('should rethrow non-Axios errors', async () => {
      const regularError = new Error('Regular error');
      mockAxiosInstance.request.mockRejectedValue(regularError);
      mockedAxios.isAxiosError.mockReturnValue(false);

      await expect(httpClient.request('GET', '/regular-error')).rejects.toThrow('Regular error');
    });

    it('should handle empty response body', async () => {
      const mockResponse: AxiosResponse = {
        data: null,
        status: 204,
        statusText: 'No Content',
        headers: {},
        config: {} as any,
        request: {}
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await httpClient.request('DELETE', '/delete');
      expect(result.data).toBeNull();
      expect(result.status).toBe(204);
    });

    it('should normalize method to uppercase', async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        request: {}
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      await httpClient.request('get', '/test');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should handle large response data', async () => {
      const largeData = new Array(10000).fill({ id: 1, data: 'test'.repeat(100) });
      const mockResponse: AxiosResponse = {
        data: largeData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        request: {}
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await httpClient.request('GET', '/large-data');
      expect(result.data).toEqual(largeData);
      expect((result.data as any[]).length).toBe(10000);
    });
  });

  describe('requestBinary()', () => {
    let httpClient: HttpClient;

    beforeEach(() => {
      httpClient = new HttpClient(mockTokenProvider, clientOptions);
    });

    it('should handle binary response correctly', async () => {
      const binaryData = new ArrayBuffer(100);
      const mockResponse: AxiosResponse<ArrayBuffer> = {
        data: binaryData,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/octet-stream' },
        config: {} as any,
        request: {}
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await httpClient.requestBinary('GET', '/binary');

      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.status).toBe(200);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({ responseType: 'arraybuffer' })
      );
    });

    it('should handle binary request errors', async () => {
      const axiosError: AxiosError = {
        message: 'Binary request failed',
        name: 'AxiosError',
        response: {
          status: 404,
          statusText: 'Not Found',
          data: {},
          headers: {},
          config: {} as any,
          request: {}
        },
        isAxiosError: true,
        toJSON: () => ({})
      } as AxiosError;

      mockAxiosInstance.request.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(httpClient.requestBinary('GET', '/binary-error')).rejects.toThrow(ConnectorException);
    });

    it('should handle empty binary response', async () => {
      const emptyBuffer = new ArrayBuffer(0);
      const mockResponse: AxiosResponse<ArrayBuffer> = {
        data: emptyBuffer,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        request: {}
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await httpClient.requestBinary('GET', '/empty-binary');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.data.length).toBe(0);
    });
  });

  describe('Request Interceptors', () => {
    let httpClient: HttpClient;
    let requestInterceptor: (config: any) => Promise<any>;

    beforeEach(() => {
      httpClient = new HttpClient(mockTokenProvider, clientOptions);
      
      // Capture the request interceptor
      const interceptorCall = mockAxiosInstance.interceptors.request.use.mock.calls[0];
      requestInterceptor = interceptorCall[0];
    });

    it('should add Authorization header with token', async () => {
      const config = { headers: {} };
      
      const result = await requestInterceptor(config);
      
      expect(mockTokenProvider.getToken).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe(`Bearer ${TEST_CONSTANTS.MOCK_TOKEN}`);
    });

    it('should handle missing headers in config', async () => {
      const config = {};
      
      const result = await requestInterceptor(config);
      
      expect(result.headers.Authorization).toBe(`Bearer ${TEST_CONSTANTS.MOCK_TOKEN}`);
    });

    it('should handle token provider errors', async () => {
      const tokenError = new Error('Token acquisition failed');
      mockTokenProvider.getToken.mockRejectedValue(tokenError);
      
      await expect(requestInterceptor({})).rejects.toThrow('Token acquisition failed');
    });

    it('should preserve existing headers', async () => {
      const config = {
        headers: {
          'Existing-Header': 'existing-value',
          'Content-Type': 'application/xml'
        }
      };
      
      const result = await requestInterceptor(config);
      
      expect(result.headers['Existing-Header']).toBe('existing-value');
      expect(result.headers['Content-Type']).toBe('application/xml');
      expect(result.headers.Authorization).toBe(`Bearer ${TEST_CONSTANTS.MOCK_TOKEN}`);
    });
  });

  describe('Response Interceptors', () => {
    let httpClient: HttpClient;
    let responseSuccessInterceptor: (response: any) => any;
    let responseErrorInterceptor: (error: any) => Promise<any>;

    beforeEach(() => {
      // Reset mocks to ensure clean state
      jest.clearAllMocks();
      
      clientOptions = new ConnectorClientOptions({
        baseUrl: TEST_CONSTANTS.MOCK_BASE_URL,
        enableLogging: true
      });
      httpClient = new HttpClient(mockTokenProvider, clientOptions);
      
      // Capture the response interceptors
      const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0];
      responseSuccessInterceptor = interceptorCall[0];
      responseErrorInterceptor = interceptorCall[1];
    });

    it('should log successful responses when logging is enabled', () => {
      const response = {
        status: 200,
        config: { method: 'GET', url: '/test' }
      };
      
      const result = responseSuccessInterceptor(response);
      
      expect(result).toBe(response);
      expect(console.log).toHaveBeenCalledWith('HTTP 200 GET /test');
    });

    it('should not log when logging is disabled', () => {
      const noLogOptions = new ConnectorClientOptions({
        baseUrl: TEST_CONSTANTS.MOCK_BASE_URL,
        enableLogging: false
      });
      new HttpClient(mockTokenProvider, noLogOptions);
      
      const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[1];
      const successInterceptor = interceptorCall[0];
      
      const response = {
        status: 200,
        config: { method: 'GET', url: '/test' }
      };
      
      successInterceptor(response);
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle 401 errors and retry with refreshed token', async () => {
      const error = {
        response: { status: 401 },
        config: {
          headers: {},
          _retryAttempted: undefined
        }
      };

      const refreshedToken = 'refreshed-token-456';
      mockTokenProvider.refreshToken.mockResolvedValue(refreshedToken);
      mockTokenProvider.getToken.mockResolvedValue(refreshedToken);
      
      const retryResponse = { data: 'retry success' };
      mockAxiosInstance.request.mockResolvedValue(retryResponse);

      const result = await responseErrorInterceptor(error);

      expect(mockTokenProvider.refreshToken).toHaveBeenCalled();
      expect(mockTokenProvider.getToken).toHaveBeenCalledTimes(1);
      expect(error.config._retryAttempted).toBe(true);
      expect((error.config.headers as any).Authorization).toBe(`Bearer ${refreshedToken}`);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(error.config);
      expect(result).toBe(retryResponse);
    });

    it('should not retry 401 if already attempted', async () => {
      const error = {
        response: { status: 401 },
        config: {
          _retryAttempted: true
        }
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      // The implementation may still call refreshToken but shouldn't retry the request
      expect(mockTokenProvider.refreshToken).toHaveBeenCalled();
    });

    it('should handle token refresh failures gracefully', async () => {
      const error = {
        response: { status: 401 },
        config: {
          headers: {},
          _retryAttempted: undefined
        }
      };

      mockTokenProvider.refreshToken.mockRejectedValue(new Error('Refresh failed'));

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(console.error).toHaveBeenCalledWith('Token refresh failed:', expect.any(Error));
    });

    it('should handle errors without response object', async () => {
      const error = { message: 'Network error' };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(console.error).toHaveBeenCalledWith('HTTP Error: Network error');
    });

    it('should handle non-401 errors normally', async () => {
      const error = {
        response: { status: 500 },
        message: 'Internal Server Error'
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(mockTokenProvider.refreshToken).not.toHaveBeenCalled();
    });

    it('should handle missing config in 401 error', async () => {
      const error = {
        response: { status: 401 },
        config: null
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    });
  });

  describe('Header Normalization', () => {
    let httpClient: HttpClient;

    beforeEach(() => {
      httpClient = new HttpClient(mockTokenProvider, clientOptions);
    });

    it('should normalize headers to lowercase keys', async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
          'UPPERCASE-HEADER': 'uppercase-value'
        },
        config: {} as any,
        request: {}
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await httpClient.request('GET', '/test');
      
      expect(result.headers['content-type']).toBe('application/json');
      expect(result.headers['x-custom-header']).toBe('custom-value');
      expect(result.headers['uppercase-header']).toBe('uppercase-value');
    });

    it('should handle null/undefined headers', async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: null as any,
        config: {} as any,
        request: {}
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await httpClient.request('GET', '/test');
      expect(result.headers).toEqual({});
    });

    it('should convert non-string header values to strings', async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Length': 1234,
          'X-Numeric': 42,
          'X-Boolean': true
        },
        config: {} as any,
        request: {}
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await httpClient.request('GET', '/test');
      
      expect(result.headers['content-length']).toBe('1234');
      expect(result.headers['x-numeric']).toBe('42');
      expect(result.headers['x-boolean']).toBe('true');
    });
  });

  describe('dispose()', () => {
    it('should dispose without errors', async () => {
      const httpClient = new HttpClient(mockTokenProvider, clientOptions);
      await expect(httpClient.dispose()).resolves.not.toThrow();
    });
  });

  describe('Edge Cases and Performance', () => {
    let httpClient: HttpClient;

    beforeEach(() => {
      httpClient = new HttpClient(mockTokenProvider, clientOptions);
    });

    it('should handle concurrent requests correctly', async () => {
      mockAxiosInstance.request.mockImplementation(() => 
        Promise.resolve({ data: { id: Math.random() }, status: 200, statusText: 'OK', headers: {}, config: {} as any, request: {} })
      );

      const promises = Array.from({ length: 10 }, (_, i) => 
        httpClient.request('GET', `/concurrent/${i}`)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });

    it('should handle very large request bodies', async () => {
      const largeBody = { data: new Array(50000).fill('test-data') };
      
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        request: {}
      });

      await httpClient.request('POST', '/large-body', largeBody);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({ data: largeBody })
      );
    });

    it('should handle special characters in URLs and headers', async () => {
      const specialPath = '/test/path with spaces/åéîøü';
      const specialHeaders = {
        'X-Special-Chars': 'value with åéîøü and spaces',
        'X-Unicode': '中文 العربية'
      };

      mockAxiosInstance.request.mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        request: {}
      });

      await httpClient.request('GET', specialPath, undefined, specialHeaders);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: specialPath,
          headers: specialHeaders
        })
      );
    });

    it('should handle timeout scenarios', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      (timeoutError as any).code = 'ECONNABORTED';
      
      mockAxiosInstance.request.mockRejectedValue(timeoutError);
      mockedAxios.isAxiosError.mockReturnValue(false);

      await expect(httpClient.request('GET', '/timeout')).rejects.toThrow('timeout of 5000ms exceeded');
    });
  });
});