/**
 * @fileoverview Comprehensive tests for all connector clients
 */

import { Office365Client } from '../src/sdk/clients/office365Client';
import { SharepointonlineClient } from '../src/sdk/clients/sharepointonlineClient';
import { TeamsClient } from '../src/sdk/clients/teamsClient';
import { MsalTokenProvider, MsalTokenProviderConfig } from '../src/sdk/authentication/msalTokenProvider';
import { ConnectorClientOptions } from '../src/sdk/base/connectorClientOptions';
import { ConnectorResponse } from '../src/sdk/base/connectorResponse';
import { ConnectorNames } from '../src/sdk/constants/connectorNames';
import { HttpClient } from '../src/sdk/utils/httpClient';
import { 
  Office365ConnectorException, 
  SharepointonlineConnectorException, 
  TeamsConnectorException 
} from '../src/sdk/utils/exceptions';
import { TEST_CONSTANTS } from './setup/testSetup';

// Mock dependencies
jest.mock('@azure/msal-node');
jest.mock('../src/sdk/utils/httpClient');

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe('Connector Clients Integration Tests', () => {
  let tokenProvider: MsalTokenProvider;
  let clientOptions: ConnectorClientOptions;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    // Mock MSAL
    const mockMsal = require('@azure/msal-node');
    mockMsal.ConfidentialClientApplication = jest.fn().mockImplementation(() => ({
      acquireTokenByClientCredential: jest.fn().mockResolvedValue({
        accessToken: TEST_CONSTANTS.MOCK_TOKEN,
        expiresOn: new Date(Date.now() + 3600000)
      })
    }));

    const config: MsalTokenProviderConfig = {
      tenantId: TEST_CONSTANTS.TENANT_ID,
      clientId: TEST_CONSTANTS.CLIENT_ID,
      clientSecret: TEST_CONSTANTS.CLIENT_SECRET
    };
    tokenProvider = new MsalTokenProvider(config);

    clientOptions = new ConnectorClientOptions({
      baseUrl: TEST_CONSTANTS.MOCK_BASE_URL,
      timeout: TEST_CONSTANTS.TIMEOUT,
      enableLogging: false
    });

    // Mock HTTP client
    mockHttpClient = {
      request: jest.fn(),
      requestBinary: jest.fn(),
      dispose: jest.fn().mockResolvedValue(undefined)
    } as any;

    MockedHttpClient.mockImplementation(() => mockHttpClient);
  });

  describe('Office365Client', () => {
    let office365Client: Office365Client;

    beforeEach(() => {
      office365Client = new Office365Client(tokenProvider, clientOptions);
    });

    afterEach(async () => {
      await office365Client.dispose();
    });

    describe('Constructor and Basic Properties', () => {
      it('should initialize with correct connector name', () => {
        expect(office365Client.connectorName).toBe(ConnectorNames.Office365);
      });

      it('should throw error when token provider is null', () => {
        expect(() => {
          new Office365Client(null as any);
        }).toThrow('Token provider is required');
      });

      it('should initialize with custom options', () => {
        const customOptions = new ConnectorClientOptions({
          baseUrl: 'https://custom-office365.com',
          timeout: 30000,
          enableLogging: true
        });

        const customClient = new Office365Client(tokenProvider, customOptions);
        expect(customClient.connectorName).toBe(ConnectorNames.Office365);
        customClient.dispose();
      });
    });

    describe('sendEmailV2Async', () => {
      it('should send email successfully', async () => {
        const emailRequest = {
          to: 'test@example.com',
          subject: 'Test Email',
          body: '<p>Test email body</p>',
          importance: 'Normal' as const
        };

        mockHttpClient.request.mockResolvedValue(
          new ConnectorResponse(undefined, 200, 'OK', {}, {} as any)
        );

        await office365Client.sendEmailV2Async(emailRequest);

        expect(mockHttpClient.request).toHaveBeenCalledWith(
          'POST',
          '/apim/office365/v2/Mail',
          emailRequest,
          { 'Content-Type': 'application/json' },
          { signal: undefined }
        );
      });

      it('should handle sendmail errors with specific exception type', async () => {
        const error = new Office365ConnectorException(
          'Email quota exceeded',
          429,
          'Too Many Requests',
          { error: { code: 'QuotaExceeded' } }
        );

        mockHttpClient.request.mockRejectedValue(error);

        await expect(office365Client.sendEmailV2Async({
          to: 'test@example.com',
          subject: 'Test',
          body: 'Test'
        })).rejects.toThrow(Office365ConnectorException);
      });

      it('should handle email with attachments', async () => {
        const emailWithAttachment = {
          to: 'test@example.com',
          subject: 'Email with attachment',
          body: 'Please find attachment',
          attachments: [{
            name: 'document.pdf',
            contentBytes: 'base64-encoded-content'
          }]
        };

        mockHttpClient.request.mockResolvedValue(
          new ConnectorResponse(undefined, 200, 'OK', {}, {} as any)
        );

        await office365Client.sendEmailV2Async(emailWithAttachment);

        expect(mockHttpClient.request).toHaveBeenCalledWith(
          'POST',
          '/apim/office365/v2/Mail',
          emailWithAttachment,
          { 'Content-Type': 'application/json' },
          { signal: undefined }
        );
      });

      it('should handle empty recipient list', async () => {
        const emailRequest = {
          to: '',
          subject: 'Test',
          body: 'Test'
        };

        const error = new Office365ConnectorException(
          'Invalid recipient',
          400,
          'Bad Request',
          { error: { message: 'Recipient cannot be empty' } }
        );

        mockHttpClient.request.mockRejectedValue(error);

        await expect(office365Client.sendEmailV2Async(emailRequest))
          .rejects.toThrow('Invalid recipient');
      });
    });

    describe('v4CalendarPostItemAsync', () => {
      it('should create calendar event successfully', async () => {
        const eventRequest = {
          subject: 'Team Meeting',
          startTime: '2024-04-10T10:00:00Z',
          endTime: '2024-04-10T11:00:00Z',
          timeZone: 'UTC',
          location: 'Conference Room A'
        };

        const mockEventResponse = {
          subject: 'Team Meeting',
          startTime: '2024-04-10T10:00:00Z',
          endTime: '2024-04-10T11:00:00Z'
        };

        mockHttpClient.request.mockResolvedValue(
          new ConnectorResponse(mockEventResponse, 201, 'Created', {}, {} as any)
        );

        const result = await office365Client.v4CalendarPostItemAsync('Calendar', eventRequest);

        expect(result).toEqual(mockEventResponse);
        expect(mockHttpClient.request).toHaveBeenCalledWith(
          'POST',
          '/apim/office365/v4/calendars/Calendar/events',
          eventRequest,
          { 'Content-Type': 'application/json' },
          { signal: undefined }
        );
      });

      it('should handle invalid date formats', async () => {
        const error = new Office365ConnectorException(
          'Invalid date format',
          400,
          'Bad Request',
          { error: { code: 'InvalidDateTime' } }
        );

        mockHttpClient.request.mockRejectedValue(error);

        await expect(office365Client.v4CalendarPostItemAsync('Calendar', {
          subject: 'Test Event',
          startTime: 'invalid-date',
          endTime: 'invalid-date',
          timeZone: 'UTC'
        })).rejects.toThrow('Invalid date format');
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should handle network timeouts', async () => {
        const timeoutError = new Error('Request timeout');
        mockHttpClient.request.mockRejectedValue(timeoutError);

        await expect(office365Client.sendEmailV2Async({
          to: 'test@example.com',
          subject: 'Test',
          body: 'Test'
        })).rejects.toThrow('Request timeout');
      });

      it('should handle very large email bodies', async () => {
        const largeBody = 'x'.repeat(100000);
        const emailRequest = {
          to: 'test@example.com',
          subject: 'Large email',
          body: largeBody
        };

        mockHttpClient.request.mockResolvedValue(
          new ConnectorResponse(undefined, 200, 'OK', {}, {} as any)
        );

        await office365Client.sendEmailV2Async(emailRequest);
        expect(mockHttpClient.request).toHaveBeenCalled();
      });

      it('should handle special characters in email content', async () => {
        const emailRequest = {
          to: 'test@example.com',
          subject: 'Email with special chars: áéíóú ñ 中文 العربية',
          body: '<p>Body with special characters: åéîøü</p>'
        };

        mockHttpClient.request.mockResolvedValue(
          new ConnectorResponse(undefined, 200, 'OK', {}, {} as any)
        );

        await office365Client.sendEmailV2Async(emailRequest);
        expect(mockHttpClient.request).toHaveBeenCalled();
      });
    });
  });

  describe('SharepointonlineClient', () => {
    let sharepointClient: SharepointonlineClient;

    beforeEach(() => {
      sharepointClient = new SharepointonlineClient(tokenProvider, clientOptions);
    });

    afterEach(async () => {
      await sharepointClient.dispose();
    });

    describe('Constructor and Basic Properties', () => {
      it('should initialize with correct connector name', () => {
        expect(sharepointClient.connectorName).toBe(ConnectorNames.SharePointOnline);
      });

      it('should throw error when token provider is null', () => {
        expect(() => {
          new SharepointonlineClient(null as any);
        }).toThrow('Token provider is required');
      });
    });

    describe('createFileAsync', () => {
      it('should create file successfully', async () => {
        const fileContent = Buffer.from('Test file content');
        const mockMetadata = {
          id: 'file-123',
          name: 'test.txt',
          path: '/sites/TestSite/Documents/test.txt'
        };

        mockHttpClient.request.mockResolvedValue(
          new ConnectorResponse(mockMetadata, 201, 'Created', {}, {} as any)
        );

        const result = await sharepointClient.createFileAsync(
          'TestSite', fileContent, '/Documents', 'test.txt'
        );

        expect(result).toEqual(mockMetadata);
        expect(mockHttpClient.request).toHaveBeenCalledWith(
          'POST',
          expect.stringContaining('/apim/sharepointonline/datasets/'),
          fileContent,
          expect.objectContaining({
            'Content-Type': 'application/octet-stream',
            'x-ms-file-name': 'test.txt'
          }),
          { signal: undefined }
        );
      });

      it('should handle file creation conflicts', async () => {
        const error = new SharepointonlineConnectorException(
          'File already exists',
          409,
          'Conflict',
          { error: { code: 'nameAlreadyExists' } }
        );

        mockHttpClient.request.mockRejectedValue(error);

        await expect(sharepointClient.createFileAsync(
          'TestSite', Buffer.from('content'), '/Documents', 'existing.txt'
        )).rejects.toThrow(SharepointonlineConnectorException);
      });
    });

    describe('getFileContentByPathAsync', () => {
      it('should get file content successfully', async () => {
        const fileContent = Buffer.from('File content data');

        mockHttpClient.requestBinary.mockResolvedValue(
          new ConnectorResponse(fileContent, 200, 'OK', {}, {} as any)
        );

        const result = await sharepointClient.getFileContentByPathAsync(
          'TestSite', '/Documents/test.txt'
        );

        expect(result).toEqual(fileContent);
        expect(mockHttpClient.requestBinary).toHaveBeenCalledWith(
          'GET',
          expect.stringContaining('/apim/sharepointonline/datasets/'),
          undefined,
          undefined,
          { signal: undefined }
        );
      });

      it('should handle file not found errors', async () => {
        const error = new SharepointonlineConnectorException(
          'File not found',
          404,
          'Not Found',
          { error: { code: 'itemNotFound' } }
        );

        mockHttpClient.requestBinary.mockRejectedValue(error);

        await expect(sharepointClient.getFileContentByPathAsync(
          'TestSite', '/Documents/nonexistent.txt'
        )).rejects.toThrow('File not found');
      });
    });

    describe('Edge Cases', () => {
      it('should handle very large file uploads', async () => {
        const largeContent = Buffer.alloc(1024 * 1024, 'x');

        mockHttpClient.request.mockResolvedValue(
          new ConnectorResponse({ id: 'large-file-123' }, 201, 'Created', {}, {} as any)
        );

        await sharepointClient.createFileAsync(
          'TestSite', largeContent, '/Documents', 'large-file.txt'
        );
        expect(mockHttpClient.request).toHaveBeenCalled();
      });

      it('should handle special characters in file names', async () => {
        mockHttpClient.request.mockResolvedValue(
          new ConnectorResponse({ id: 'special-file' }, 201, 'Created', {}, {} as any)
        );

        await sharepointClient.createFileAsync(
          'TestSite', Buffer.from('content'), '/Documents', 'file spaces.txt'
        );
        expect(mockHttpClient.request).toHaveBeenCalled();
      });

      it('should handle permission denied errors', async () => {
        const error = new SharepointonlineConnectorException(
          'Access denied',
          403,
          'Forbidden',
          { error: { code: 'accessDenied' } }
        );

        mockHttpClient.request.mockRejectedValue(error);

        await expect(sharepointClient.createFileAsync(
          'RestrictedSite', Buffer.from('content'), '/SecureDocuments', 'test.txt'
        )).rejects.toThrow('Access denied');
      });
    });
  });

  describe('TeamsClient', () => {
    let teamsClient: TeamsClient;

    beforeEach(() => {
      teamsClient = new TeamsClient(tokenProvider, clientOptions);
    });

    afterEach(async () => {
      await teamsClient.dispose();
    });

    describe('Constructor and Basic Properties', () => {
      it('should initialize with correct connector name', () => {
        expect(teamsClient.connectorName).toBe(ConnectorNames.Teams);
      });

      it('should throw error when token provider is null', () => {
        expect(() => {
          new TeamsClient(null as any);
        }).toThrow('Token provider is required');
      });
    });

    describe('postMessageToChannelAsync', () => {
      it('should post message successfully', async () => {
        const mockResponse = {
          messageID: 'message-789',
          messageLink: 'https://teams.microsoft.com/...'
        };

        mockHttpClient.request.mockResolvedValue(
          new ConnectorResponse(mockResponse, 201, 'Created', {}, {} as any)
        );

        const result = await teamsClient.postMessageToChannelAsync(
          'team-123', 'channel-456', 'Hello, Team!'
        );

        expect(result).toEqual(mockResponse);
        expect(mockHttpClient.request).toHaveBeenCalledWith(
          'POST',
          expect.stringContaining('/beta/teams/conversation/message/poster/'),
          expect.objectContaining({
            recipient: {
              groupId: 'team-123',
              channelId: 'channel-456',
            },
            messageBody: 'Hello, Team!'
          }),
          { 'Content-Type': 'application/json' },
          { signal: undefined }
        );
      });

      it('should handle invalid team/channel IDs', async () => {
        const error = new TeamsConnectorException(
          'Team or channel not found',
          404,
          'Not Found',
          { error: { code: 'NotFound' } }
        );

        mockHttpClient.request.mockRejectedValue(error);

        await expect(teamsClient.postMessageToChannelAsync(
          'invalid-team', 'invalid-channel', 'Test'
        )).rejects.toThrow(TeamsConnectorException);
      });
    });

    describe('getAllTeamsAsync', () => {
      it('should get all teams successfully', async () => {
        const teamsData = {
          teamsList: [
            { id: 'team-1', displayName: 'Team 1' },
            { id: 'team-2', displayName: 'Team 2' }
          ]
        };

        mockHttpClient.request.mockResolvedValue(
          new ConnectorResponse(teamsData, 200, 'OK', {}, {} as any)
        );

        const result = await teamsClient.getAllTeamsAsync();

        expect(result).toEqual(teamsData);
        expect(mockHttpClient.request).toHaveBeenCalledWith(
          'GET',
          '/apim/teams/v1.0/me/joinedTeams',
          undefined,
          undefined,
          { signal: undefined }
        );
      });

      it('should handle empty teams list', async () => {
        const teamsData = { teamsList: [] };

        mockHttpClient.request.mockResolvedValue(
          new ConnectorResponse(teamsData, 200, 'OK', {}, {} as any)
        );

        const result = await teamsClient.getAllTeamsAsync();
        expect(result.teamsList).toHaveLength(0);
      });
    });

    describe('postMessageToConversationAsync', () => {
      it('should post conversation message successfully', async () => {
        const input = {
          additionalProperties: {
            recipient: { groupId: 'team-123', channelId: 'channel-456' },
            messageBody: 'Hello from conversation'
          }
        };

        const mockResponse = { messageID: 'conv-msg-123' };

        mockHttpClient.request.mockResolvedValue(
          new ConnectorResponse(mockResponse, 201, 'Created', {}, {} as any)
        );

        const result = await teamsClient.postMessageToConversationAsync(
          'Flow bot', 'Channel', input
        );

        expect(result).toEqual(mockResponse);
        expect(mockHttpClient.request).toHaveBeenCalledWith(
          'POST',
          expect.stringContaining('/beta/teams/conversation/message/poster/'),
          input.additionalProperties,
          { 'Content-Type': 'application/json' },
          { signal: undefined }
        );
      });

      it('should handle invalid format error', async () => {
        const error = new TeamsConnectorException(
          'Invalid message format',
          400,
          'Bad Request',
          { error: { code: 'InvalidFormat' } }
        );

        mockHttpClient.request.mockRejectedValue(error);

        await expect(teamsClient.postMessageToConversationAsync(
          'Flow bot', 'Channel', { additionalProperties: {} }
        )).rejects.toThrow('Invalid message format');
      });
    });

    describe('Edge Cases', () => {
      it('should handle rate limiting errors', async () => {
        const error = new TeamsConnectorException(
          'Rate limit exceeded',
          429,
          'Too Many Requests',
          { error: { code: 'TooManyRequests', retryAfter: 60 } }
        );

        mockHttpClient.request.mockRejectedValue(error);

        await expect(teamsClient.postMessageToChannelAsync(
          'team-123', 'channel-456', 'Test'
        )).rejects.toThrow('Rate limit exceeded');
      });

      it('should handle very long messages', async () => {
        const longMessage = 'x'.repeat(5000);

        mockHttpClient.request.mockResolvedValue(
          new ConnectorResponse({ messageID: 'long-msg' }, 201, 'Created', {}, {} as any)
        );

        await teamsClient.postMessageToChannelAsync('team-123', 'channel-456', longMessage);
        expect(mockHttpClient.request).toHaveBeenCalled();
      });
    });
  });

  describe('Cross-Client Integration Tests', () => {
    let office365Client: Office365Client;
    let sharepointClient: SharepointonlineClient;
    let teamsClient: TeamsClient;

    beforeEach(() => {
      office365Client = new Office365Client(tokenProvider, clientOptions);
      sharepointClient = new SharepointonlineClient(tokenProvider, clientOptions);
      teamsClient = new TeamsClient(tokenProvider, clientOptions);
    });

    afterEach(async () => {
      await Promise.all([
        office365Client.dispose(),
        sharepointClient.dispose(),
        teamsClient.dispose()
      ]);
    });

    it('should handle concurrent operations across different clients', async () => {
      mockHttpClient.request
        .mockResolvedValueOnce(new ConnectorResponse(undefined, 200, 'OK', {}, {} as any))
        .mockResolvedValueOnce(new ConnectorResponse({ id: 'file-123' }, 201, 'Created', {}, {} as any))
        .mockResolvedValueOnce(new ConnectorResponse({ messageID: 'msg-123' }, 201, 'Created', {}, {} as any));

      const promises = [
        office365Client.sendEmailV2Async({ to: 'test@example.com', subject: 'Test', body: 'Test' }),
        sharepointClient.createFileAsync('TestSite', Buffer.from('content'), '/Documents', 'test.txt'),
        teamsClient.postMessageToChannelAsync('team-123', 'channel-456', 'Hello')
      ];

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should share token provider across all clients', () => {
      expect(MockedHttpClient).toHaveBeenCalledTimes(3);
      expect(MockedHttpClient).toHaveBeenNthCalledWith(1, tokenProvider, expect.any(ConnectorClientOptions));
      expect(MockedHttpClient).toHaveBeenNthCalledWith(2, tokenProvider, expect.any(ConnectorClientOptions));
      expect(MockedHttpClient).toHaveBeenNthCalledWith(3, tokenProvider, expect.any(ConnectorClientOptions));
    });

    it('should dispose all clients without errors', async () => {
      await expect(Promise.all([
        office365Client.dispose(),
        sharepointClient.dispose(),
        teamsClient.dispose()
      ])).resolves.not.toThrow();

      expect(mockHttpClient.dispose).toHaveBeenCalledTimes(3);
    });

    it('should handle token refresh across all clients', async () => {
      const unauthorizedError = {
        response: { status: 401 },
        config: { headers: {} }
      };

      mockHttpClient.request.mockRejectedValue(unauthorizedError);

      await expect(Promise.all([
        office365Client.sendEmailV2Async({ to: 'test@example.com', subject: 'Test', body: 'Test' })
          .catch(() => 'office365-error'),
        sharepointClient.createFileAsync('TestSite', Buffer.from('content'), '/Documents', 'test.txt')
          .catch(() => 'sharepoint-error'),
        teamsClient.postMessageToChannelAsync('team-123', 'channel-456', 'Hello')
          .catch(() => 'teams-error')
      ])).resolves.toEqual(['office365-error', 'sharepoint-error', 'teams-error']);
    });
  });

  describe('Memory Management and Performance', () => {
    it('should handle creation and disposal of many clients', async () => {
      const clients: Array<Office365Client | SharepointonlineClient | TeamsClient> = [];

      for (let i = 0; i < 50; i++) {
        switch (i % 3) {
          case 0:
            clients.push(new Office365Client(tokenProvider, clientOptions));
            break;
          case 1:
            clients.push(new SharepointonlineClient(tokenProvider, clientOptions));
            break;
          case 2:
            clients.push(new TeamsClient(tokenProvider, clientOptions));
            break;
        }
      }

      expect(clients).toHaveLength(50);

      await Promise.all(clients.map(client => client.dispose()));

      expect(mockHttpClient.dispose).toHaveBeenCalledTimes(50);
    });

    it('should handle rapid client creation and disposal', async () => {
      for (let i = 0; i < 10; i++) {
        const client = new Office365Client(tokenProvider, clientOptions);
        await client.dispose();
      }

      expect(MockedHttpClient).toHaveBeenCalledTimes(10);
      expect(mockHttpClient.dispose).toHaveBeenCalledTimes(10);
    });
  });

  describe('ConnectorClientOptions', () => {
    it('should initialize with default values', () => {
      const options = new ConnectorClientOptions();
      expect(options.timeout).toBe(30000);
      expect(options.maxRetryAttempts).toBe(3);
      expect(options.enableLogging).toBe(false);
      expect(options.userAgent).toBe('Azure-Connectors-NodeJS-SDK/1.0.0');
    });

    it('should accept custom values', () => {
      const options = new ConnectorClientOptions({
        timeout: 5000,
        enableLogging: true,
        userAgent: 'Custom-Agent'
      });

      expect(options.timeout).toBe(5000);
      expect(options.enableLogging).toBe(true);
      expect(options.userAgent).toBe('Custom-Agent');
    });
  });
});
