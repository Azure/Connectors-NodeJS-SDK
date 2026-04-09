/**
 * @fileoverview Global test setup configuration
 */

// Mock console methods globally for testing
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
      toBeValidGuid(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidDate(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },

  toBeValidGuid(received: string) {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && guidRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid GUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid GUID`,
        pass: false,
      };
    }
  }
});

// Global test constants
export const TEST_CONSTANTS = {
  TENANT_ID: 'test-tenant-id',
  CLIENT_ID: 'test-client-id', 
  CLIENT_SECRET: 'test-client-secret',
  MOCK_TOKEN: 'mock-access-token-12345',
  MOCK_BASE_URL: 'https://test-base-url.com',
  TIMEOUT: 5000
};