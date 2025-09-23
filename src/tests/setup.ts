/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

import '@testing-library/jest-dom';

// Mock window.fetch for API calls
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock Stripe
global.window = global.window || {};
(global.window as any).Stripe = jest.fn().mockReturnValue({
  createPaymentMethod: jest.fn().mockResolvedValue({
    paymentMethod: { id: 'pm_test_123' },
    error: null,
  }),
  redirectToCheckout: jest.fn().mockResolvedValue({ error: null }),
});

// Mock Braintree
(global.window as any).braintree = {
  dropin: {
    create: jest.fn().mockImplementation((options, callback) => {
      const mockInstance = {
        requestPaymentMethod: jest.fn().mockResolvedValue({
          nonce: 'test-nonce',
          type: 'CreditCard',
          details: { lastFour: '4242' },
        }),
        clearSelectedPaymentMethod: jest.fn(),
        isPaymentMethodRequestable: jest.fn().mockReturnValue(true),
        teardown: jest.fn().mockResolvedValue(undefined),
      };
      callback(null, mockInstance);
    }),
  },
};

// Mock Authorize.Net
(global.window as any).Accept = {
  dispatchData: jest.fn().mockImplementation((data, callback) => {
    callback({
      messages: { resultCode: 'Ok', message: [] },
      opaqueData: {
        dataDescriptor: 'COMMON.ACCEPT.INAPP.PAYMENT',
        dataValue: 'test-token',
      },
    });
  }),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PAYMENT_API_BASE_URL = 'http://localhost:3000/api';

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  (fetch as jest.Mock).mockClear();
});