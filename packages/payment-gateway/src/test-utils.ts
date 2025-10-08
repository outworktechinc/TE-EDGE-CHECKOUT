/**
 * Testing Utilities
 * Helpers for testing payment integrations
 */

import { GatewayName, CardInput, EnvironmentAdapter, GatewayConfig } from './types';

/**
 * Test card numbers for each gateway
 */
export const TEST_CARDS = {
  stripe: {
    success: '4242424242424242',
    decline: '4000000000000002',
    insufficientFunds: '4000000000009995',
    lostCard: '4000000000009987',
    stolenCard: '4000000000009979',
    expiredCard: '4000000000000069',
    incorrectCVC: '4000000000000127',
    processingError: '4000000000000119',
    requiresAuthentication: '4000002500003155' // 3DS required
  },
  braintree: {
    success: '4111111111111111',
    decline: '4000111111111115',
    processorDecline: '4000111111111127',
    fraudDecline: '4000111111111010',
    processingError: '4009348888881881'
  },
  authorizenet: {
    success: '4007000000027',
    decline: '4222222222222',
    insufficientFunds: '4024007134364842',
    invalidExpiryDate: '4000300011112220',
    processingError: '4012888888881881'
  }
};

/**
 * Get test card for specific scenario
 */
export function getTestCard(
  gateway: GatewayName,
  scenario: keyof typeof TEST_CARDS.stripe = 'success'
): CardInput {
  const cards = {
    'Stripe': TEST_CARDS.stripe,
    'Braintree': TEST_CARDS.braintree,
    'Authorize.Net': TEST_CARDS.authorizenet
  };

  const gatewayCards = cards[gateway] as any;
  const cardNumber = gatewayCards[scenario] || gatewayCards.success;

  return {
    number: cardNumber,
    expMonth: '12',
    expYear: '2025',
    cvc: '123'
  };
}

/**
 * Get all test cards for a gateway
 */
export function getAllTestCards(gateway: GatewayName): Record<string, CardInput> {
  const cards = {
    'Stripe': TEST_CARDS.stripe,
    'Braintree': TEST_CARDS.braintree,
    'Authorize.Net': TEST_CARDS.authorizenet
  };

  const gatewayCards = cards[gateway] as any;
  const result: Record<string, CardInput> = {};

  for (const [scenario, number] of Object.entries(gatewayCards)) {
    result[scenario] = {
      number: number as string,
      expMonth: '12',
      expYear: '2025',
      cvc: '123'
    };
  }

  return result;
}

/**
 * Create mock environment adapter for testing
 */
export function createMockAdapter(config: Partial<GatewayConfig> = {}): EnvironmentAdapter {
  const defaultConfig: GatewayConfig = {
    stripePublishableKey: 'pk_test_mock',
    authorizeNetClientKey: 'mock_client_key',
    authorizeNetApiLoginId: 'mock_api_login',
    braintreeClientTokenUrl: '/api/braintree/token',
    apiBaseUrl: 'https://mock-api.example.com',
    ...config
  };

  return {
    getConfig: (key) => defaultConfig[key],
    isBrowser: () => true,
    fetch: async (_url, _options) => {
      // Mock successful response
      return new Response(
        JSON.stringify({
          success: true,
          data: { mock: true }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Create mock adapter with custom fetch behavior
 */
export function createMockAdapterWithFetch(
  fetchMock: (url: string, options?: RequestInit) => Promise<Response>,
  config: Partial<GatewayConfig> = {}
): EnvironmentAdapter {
  const adapter = createMockAdapter(config);
  adapter.fetch = fetchMock;
  return adapter;
}

/**
 * Mock fetch that fails
 */
export async function failingFetch(_url: string, _options?: RequestInit): Promise<Response> {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Mock error'
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Mock fetch that times out
 */
export async function timeoutFetch(_url: string, _options?: RequestInit): Promise<Response> {
  await new Promise(resolve => setTimeout(resolve, 60000)); // Never resolves in practice
  return new Response('', { status: 408 });
}

/**
 * Generate random test card details
 */
export function generateRandomCard(gateway: GatewayName = 'Stripe'): CardInput {
  return getTestCard(gateway, 'success');
}

/**
 * Validate test environment setup
 */
export function validateTestEnvironment(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if running in browser
  if (typeof window !== 'undefined') {
    warnings.push('Tests should run in Node.js environment, not browser');
  }

  // Check if test mode is enabled
  const isTestMode = process.env.NODE_ENV === 'test';
  if (!isTestMode) {
    warnings.push('NODE_ENV is not set to "test"');
  }

  // Check for test API keys
  const hasTestKeys = [
    'STRIPE_TEST_KEY',
    'BRAINTREE_TEST_KEY',
    'AUTHNET_TEST_KEY'
  ].some(key => process.env[key]?.includes('test'));

  if (!hasTestKeys) {
    warnings.push('No test API keys found in environment variables');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Wait for condition (useful for async tests)
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (true) {
    const result = await condition();
    if (result) {
      return;
    }

    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Mock timer helpers
 */
export class MockTimer {
  private timers: Array<{ callback: () => void; delay: number; time: number }> = [];
  private currentTime = 0;

  setTimeout(callback: () => void, delay: number): number {
    const id = this.timers.length;
    this.timers.push({
      callback,
      delay,
      time: this.currentTime + delay
    });
    return id;
  }

  clearTimeout(id: number): void {
    this.timers[id] = null as any;
  }

  tick(ms: number): void {
    this.currentTime += ms;

    const triggered = this.timers.filter(
      timer => timer && timer.time <= this.currentTime
    );

    triggered.forEach(timer => {
      timer.callback();
    });

    this.timers = this.timers.filter(
      timer => timer && timer.time > this.currentTime
    );
  }

  tickAsync(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.tick(ms);
      resolve();
    });
  }

  reset(): void {
    this.timers = [];
    this.currentTime = 0;
  }
}

/**
 * Test data generators
 */
export const TestData = {
  /**
   * Generate random billing address
   */
  randomAddress: () => ({
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Test Street',
    address2: 'Apt 4B',
    city: 'Test City',
    state: 'CA',
    zip: '90210',
    country: 'US'
  }),

  /**
   * Generate random email
   */
  randomEmail: () => `test${Date.now()}@example.com`,

  /**
   * Generate random phone
   */
  randomPhone: () => '555-0100',

  /**
   * Generate random amount
   */
  randomAmount: (min = 1, max = 1000) =>
    Math.floor(Math.random() * (max - min + 1)) + min
};

/**
 * Snapshot comparison helper
 */
export function createSnapshot<T>(data: T): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Deep clone helper for test data
 */
export function cloneTestData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
