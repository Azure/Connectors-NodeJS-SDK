/**
 * @fileoverview Comprehensive tests for MsalTokenProvider
 */

import { MsalTokenProvider, MsalTokenProviderConfig } from '../../src/sdk/authentication/msalTokenProvider';
import { ConfidentialClientApplication, AuthenticationResult } from '@azure/msal-node';
import { TEST_CONSTANTS } from '../setup/testSetup';

// Mock MSAL module
jest.mock('@azure/msal-node');
const MockedConfidentialClientApplication = ConfidentialClientApplication as jest.MockedClass<typeof ConfidentialClientApplication>;

describe('MsalTokenProvider', () => {
  let mockClientApp: jest.Mocked<ConfidentialClientApplication>;
  let defaultConfig: MsalTokenProviderConfig;
  
  beforeEach(() => {
    // Create mock MSAL client
    mockClientApp = {
      acquireTokenByClientCredential: jest.fn(),
    } as any;
    MockedConfidentialClientApplication.mockImplementation(() => mockClientApp);

    defaultConfig = {
      tenantId: TEST_CONSTANTS.TENANT_ID,
      clientId: TEST_CONSTANTS.CLIENT_ID,
      clientSecret: TEST_CONSTANTS.CLIENT_SECRET
    };
  });

  describe('Constructor', () => {
    it('should initialize with minimal config', () => {
      const provider = new MsalTokenProvider(defaultConfig);
      expect(provider).toBeInstanceOf(MsalTokenProvider);
      expect(MockedConfidentialClientApplication).toHaveBeenCalledWith({
        auth: {
          clientId: TEST_CONSTANTS.CLIENT_ID,
          clientSecret: TEST_CONSTANTS.CLIENT_SECRET,
          authority: `https://login.microsoftonline.com/${TEST_CONSTANTS.TENANT_ID}`
        }
      });
    });

    it('should initialize with custom authority', () => {
      const customAuthority = 'https://custom.authority.com';
      const config = { ...defaultConfig, authority: customAuthority };
      
      new MsalTokenProvider(config);
      
      expect(MockedConfidentialClientApplication).toHaveBeenCalledWith({
        auth: {
          clientId: TEST_CONSTANTS.CLIENT_ID,
          clientSecret: TEST_CONSTANTS.CLIENT_SECRET,
          authority: customAuthority
        }
      });
    });

    it('should initialize with custom default scopes', () => {
      const customScopes = ['custom://scope1', 'custom://scope2'];
      const config = { ...defaultConfig, defaultScopes: customScopes };
      
      const provider = new MsalTokenProvider(config);
      expect(provider).toBeInstanceOf(MsalTokenProvider);
    });

    it('should handle empty config values gracefully', () => {
      // Constructor doesn't validate these - MSAL will handle validation at runtime
      expect(() => new MsalTokenProvider({
        tenantId: '',
        clientId: TEST_CONSTANTS.CLIENT_ID,
        clientSecret: TEST_CONSTANTS.CLIENT_SECRET
      })).not.toThrow();

      expect(() => new MsalTokenProvider({
        tenantId: TEST_CONSTANTS.TENANT_ID,
        clientId: '',
        clientSecret: TEST_CONSTANTS.CLIENT_SECRET
      })).not.toThrow();

      expect(() => new MsalTokenProvider({
        tenantId: TEST_CONSTANTS.TENANT_ID,
        clientId: TEST_CONSTANTS.CLIENT_ID,
        clientSecret: ''
      })).not.toThrow();
    });
  });

  describe('getToken()', () => {
    let provider: MsalTokenProvider;
    let mockAuthResult: AuthenticationResult;

    beforeEach(() => {
      provider = new MsalTokenProvider(defaultConfig);
      mockAuthResult = {
        accessToken: TEST_CONSTANTS.MOCK_TOKEN,
        expiresOn: new Date(Date.now() + 3600000), // 1 hour from now
        account: null,
        idToken: '',
        idTokenClaims: {},
        scopes: ['https://graph.microsoft.com/.default'],
        tenantId: TEST_CONSTANTS.TENANT_ID,
        uniqueId: 'test-unique-id',
        tokenType: 'Bearer',
        authority: 'https://login.microsoftonline.com/test-tenant',
        fromCache: false,
        correlationId: 'test-correlation-id'
      };
    });

    it('should get token successfully on first call', async () => {
      mockClientApp.acquireTokenByClientCredential.mockResolvedValue(mockAuthResult);
      
      const token = await provider.getToken();
      
      expect(token).toBe(TEST_CONSTANTS.MOCK_TOKEN);
      expect(mockClientApp.acquireTokenByClientCredential).toHaveBeenCalledWith({
        scopes: ['https://graph.microsoft.com/.default']
      });
    });

    it('should use custom scopes when provided', async () => {
      const customScopes = ['custom://scope1', 'custom://scope2'];
      mockClientApp.acquireTokenByClientCredential.mockResolvedValue(mockAuthResult);
      
      await provider.getToken(customScopes);
      
      expect(mockClientApp.acquireTokenByClientCredential).toHaveBeenCalledWith({
        scopes: customScopes
      });
    });

    it('should return cached token if still valid', async () => {
      mockClientApp.acquireTokenByClientCredential.mockResolvedValue(mockAuthResult);
      
      // First call - should acquire token
      const token1 = await provider.getToken();
      expect(mockClientApp.acquireTokenByClientCredential).toHaveBeenCalledTimes(1);
      
      // Second call - should use cached token
      const token2 = await provider.getToken();
      expect(token1).toBe(token2);
      expect(mockClientApp.acquireTokenByClientCredential).toHaveBeenCalledTimes(1);
    });

    it('should acquire new token if cached token is expired', async () => {
      // First call with expired token
      const expiredResult = {
        ...mockAuthResult,
        expiresOn: new Date(Date.now() - 3600000) // 1 hour ago
      };
      mockClientApp.acquireTokenByClientCredential
        .mockResolvedValueOnce(expiredResult)
        .mockResolvedValueOnce(mockAuthResult);
      
      // First call
      await provider.getToken();
      
      // Second call - should acquire new token due to expiration
      const token2 = await provider.getToken();
      
      expect(token2).toBe(TEST_CONSTANTS.MOCK_TOKEN);
      expect(mockClientApp.acquireTokenByClientCredential).toHaveBeenCalledTimes(2);
    });

    it('should acquire new token if cached token expires within buffer time', async () => {
      // Token expires in 2 minutes (within 5-minute buffer)
      const soonToExpireResult = {
        ...mockAuthResult,
        expiresOn: new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now
      };
      mockClientApp.acquireTokenByClientCredential
        .mockResolvedValueOnce(soonToExpireResult)
        .mockResolvedValueOnce(mockAuthResult);
      
      // First call
      await provider.getToken();
      
      // Second call - should acquire new token due to buffer time
      await provider.getToken();
      
      expect(mockClientApp.acquireTokenByClientCredential).toHaveBeenCalledTimes(2);
    });

    it('should handle MSAL client returning null response', async () => {
      mockClientApp.acquireTokenByClientCredential.mockResolvedValue(null);
      
      await expect(provider.getToken()).rejects.toThrow('Failed to acquire token: No response received');
    });

    it('should handle MSAL client throwing error', async () => {
      const error = new Error('MSAL error');
      mockClientApp.acquireTokenByClientCredential.mockRejectedValue(error);
      
      await expect(provider.getToken()).rejects.toThrow('Failed to acquire token: MSAL error');
    });

    it('should handle non-Error objects being thrown', async () => {
      mockClientApp.acquireTokenByClientCredential.mockRejectedValue('string error');
      
      await expect(provider.getToken()).rejects.toThrow('Failed to acquire token: Unknown error');
    });

    it('should handle token without expiration date', async () => {
      const tokenWithoutExpiry = {
        accessToken: TEST_CONSTANTS.MOCK_TOKEN,
        expiresOn: null, // Changed from undefined to null
        account: null,
        idToken: '',
        idTokenClaims: {},
        scopes: ['https://graph.microsoft.com/.default'],
        tenantId: TEST_CONSTANTS.TENANT_ID,
        uniqueId: 'test-unique-id',
        tokenType: 'Bearer',
        authority: 'https://login.microsoftonline.com/test-tenant',
        fromCache: false,
        correlationId: 'test-correlation-id'
      };
      mockClientApp.acquireTokenByClientCredential
        .mockResolvedValueOnce(tokenWithoutExpiry)
        .mockResolvedValueOnce(mockAuthResult);
      
      // First call
      await provider.getToken();
      
      // Second call - should acquire new token since expiry is null
      await provider.getToken();
      
      expect(mockClientApp.acquireTokenByClientCredential).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshToken()', () => {
    let provider: MsalTokenProvider;
    let mockAuthResult: AuthenticationResult;

    beforeEach(() => {
      provider = new MsalTokenProvider(defaultConfig);
      mockAuthResult = {
        accessToken: 'refreshed-token',
        expiresOn: new Date(Date.now() + 3600000),
        account: null,
        idToken: '',
        idTokenClaims: {},
        scopes: ['https://graph.microsoft.com/.default'],
        tenantId: TEST_CONSTANTS.TENANT_ID,
        uniqueId: 'test-unique-id',
        tokenType: 'Bearer',
        authority: 'https://login.microsoftonline.com/test-tenant',
        fromCache: false,
        correlationId: 'test-correlation-id'
      };
    });

    it('should refresh token and return new token', async () => {
      const initialResult = {
        ...mockAuthResult,
        accessToken: 'initial-token'
      };
      mockClientApp.acquireTokenByClientCredential
        .mockResolvedValueOnce(initialResult)
        .mockResolvedValueOnce(mockAuthResult);
      
      // Get initial token
      const initialToken = await provider.getToken();
      expect(initialToken).toBe('initial-token');
      
      // Refresh token
      const refreshedToken = await provider.refreshToken();
      expect(refreshedToken).toBe('refreshed-token');
      expect(refreshedToken).not.toBe(initialToken);
    });

    it('should use custom scopes when refreshing', async () => {
      const customScopes = ['custom://refresh'];
      mockClientApp.acquireTokenByClientCredential.mockResolvedValue(mockAuthResult);
      
      await provider.refreshToken(customScopes);
      
      expect(mockClientApp.acquireTokenByClientCredential).toHaveBeenCalledWith({
        scopes: customScopes
      });
    });

    it('should force new token acquisition even with valid cached token', async () => {
      // Set up valid cached token
      mockClientApp.acquireTokenByClientCredential.mockResolvedValue(mockAuthResult);
      await provider.getToken(); // Cache a token
      
      // Refresh should ignore cache and get new token
      const refreshedResult = {
        ...mockAuthResult,
        accessToken: 'new-refreshed-token'
      };
      mockClientApp.acquireTokenByClientCredential.mockResolvedValue(refreshedResult);
      
      const token = await provider.refreshToken();
      
      expect(token).toBe('new-refreshed-token');
      expect(mockClientApp.acquireTokenByClientCredential).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during refresh', async () => {
      const error = new Error('Refresh failed');
      mockClientApp.acquireTokenByClientCredential.mockRejectedValue(error);
      
      await expect(provider.refreshToken()).rejects.toThrow('Failed to acquire token: Refresh failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent token requests', async () => {
      const provider = new MsalTokenProvider(defaultConfig);
      const mockAuthResult: AuthenticationResult = {
        accessToken: TEST_CONSTANTS.MOCK_TOKEN,
        expiresOn: new Date(Date.now() + 3600000),
        account: null,
        idToken: '',
        idTokenClaims: {},
        scopes: ['https://graph.microsoft.com/.default'],
        tenantId: TEST_CONSTANTS.TENANT_ID,
        uniqueId: 'test-unique-id',
        tokenType: 'Bearer',
        authority: 'https://login.microsoftonline.com/test-tenant',
        fromCache: false,
        correlationId: 'test-correlation-id'
      };
      
      mockClientApp.acquireTokenByClientCredential.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockAuthResult), 100))
      );
      
      // Make concurrent requests
      const promises = [
        provider.getToken(),
        provider.getToken(),
        provider.getToken()
      ];
      
      const tokens = await Promise.all(promises);
      
      // All should return the same token value
      expect(tokens[0]).toBe(tokens[1]);
      expect(tokens[1]).toBe(tokens[2]);
    });

    it('should handle very large token response', async () => {
      const provider = new MsalTokenProvider(defaultConfig);
      const largeToken = 'x'.repeat(10000); // Very large token
      const mockAuthResult: AuthenticationResult = {
        accessToken: largeToken,
        expiresOn: new Date(Date.now() + 3600000),
        account: null,
        idToken: '',
        idTokenClaims: {},
        scopes: ['https://graph.microsoft.com/.default'],
        tenantId: TEST_CONSTANTS.TENANT_ID,
        uniqueId: 'test-unique-id',
        tokenType: 'Bearer',
        authority: 'https://login.microsoftonline.com/test-tenant',
        fromCache: false,
        correlationId: 'test-correlation-id'
      };
      
      mockClientApp.acquireTokenByClientCredential.mockResolvedValue(mockAuthResult);
      
      const token = await provider.getToken();
      expect(token).toBe(largeToken);
    });

    it('should handle invalid date objects in expiration', async () => {
      const provider = new MsalTokenProvider(defaultConfig);
      const mockAuthResult: AuthenticationResult = {
        accessToken: TEST_CONSTANTS.MOCK_TOKEN,
        expiresOn: new Date('invalid-date'),
        account: null,
        idToken: '',
        idTokenClaims: {},
        scopes: ['https://graph.microsoft.com/.default'],
        tenantId: TEST_CONSTANTS.TENANT_ID,
        uniqueId: 'test-unique-id',
        tokenType: 'Bearer',
        authority: 'https://login.microsoftonline.com/test-tenant',
        fromCache: false,
        correlationId: 'test-correlation-id'
      };
      
      mockClientApp.acquireTokenByClientCredential
        .mockResolvedValueOnce(mockAuthResult)
        .mockResolvedValue({
          ...mockAuthResult,
          expiresOn: new Date(Date.now() + 3600000)
        });
      
      // First call with invalid date
      await provider.getToken();
      
      // Second call should acquire new token due to invalid expiry
      await provider.getToken();
      
      expect(mockClientApp.acquireTokenByClientCredential).toHaveBeenCalledTimes(2);
    });
  });
});