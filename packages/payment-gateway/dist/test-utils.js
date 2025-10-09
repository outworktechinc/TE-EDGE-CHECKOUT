"use strict";
/**
 * Testing Utilities
 * Helpers for testing payment integrations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestData = exports.MockTimer = exports.TEST_CARDS = void 0;
exports.getTestCard = getTestCard;
exports.getAllTestCards = getAllTestCards;
exports.createMockAdapter = createMockAdapter;
exports.createMockAdapterWithFetch = createMockAdapterWithFetch;
exports.failingFetch = failingFetch;
exports.timeoutFetch = timeoutFetch;
exports.generateRandomCard = generateRandomCard;
exports.validateTestEnvironment = validateTestEnvironment;
exports.waitFor = waitFor;
exports.createSnapshot = createSnapshot;
exports.cloneTestData = cloneTestData;
/**
 * Test card numbers for each gateway
 */
exports.TEST_CARDS = {
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
function getTestCard(gateway, scenario = 'success') {
    const cards = {
        'Stripe': exports.TEST_CARDS.stripe,
        'Braintree': exports.TEST_CARDS.braintree,
        'Authorize.Net': exports.TEST_CARDS.authorizenet
    };
    const gatewayCards = cards[gateway];
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
function getAllTestCards(gateway) {
    const cards = {
        'Stripe': exports.TEST_CARDS.stripe,
        'Braintree': exports.TEST_CARDS.braintree,
        'Authorize.Net': exports.TEST_CARDS.authorizenet
    };
    const gatewayCards = cards[gateway];
    const result = {};
    for (const [scenario, number] of Object.entries(gatewayCards)) {
        result[scenario] = {
            number: number,
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
function createMockAdapter(config = {}) {
    const defaultConfig = {
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
            return new Response(JSON.stringify({
                success: true,
                data: { mock: true }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    };
}
/**
 * Create mock adapter with custom fetch behavior
 */
function createMockAdapterWithFetch(fetchMock, config = {}) {
    const adapter = createMockAdapter(config);
    adapter.fetch = fetchMock;
    return adapter;
}
/**
 * Mock fetch that fails
 */
async function failingFetch(_url, _options) {
    return new Response(JSON.stringify({
        success: false,
        error: 'Mock error'
    }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
}
/**
 * Mock fetch that times out
 */
async function timeoutFetch(_url, _options) {
    await new Promise(resolve => setTimeout(resolve, 60000)); // Never resolves in practice
    return new Response('', { status: 408 });
}
/**
 * Generate random test card details
 */
function generateRandomCard(gateway = 'Stripe') {
    return getTestCard(gateway, 'success');
}
/**
 * Validate test environment setup
 */
function validateTestEnvironment() {
    const errors = [];
    const warnings = [];
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
async function waitFor(condition, timeout = 5000, interval = 100) {
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
class MockTimer {
    constructor() {
        this.timers = [];
        this.currentTime = 0;
    }
    setTimeout(callback, delay) {
        const id = this.timers.length;
        this.timers.push({
            callback,
            delay,
            time: this.currentTime + delay
        });
        return id;
    }
    clearTimeout(id) {
        this.timers[id] = null;
    }
    tick(ms) {
        this.currentTime += ms;
        const triggered = this.timers.filter(timer => timer && timer.time <= this.currentTime);
        triggered.forEach(timer => {
            timer.callback();
        });
        this.timers = this.timers.filter(timer => timer && timer.time > this.currentTime);
    }
    tickAsync(ms) {
        return new Promise(resolve => {
            this.tick(ms);
            resolve();
        });
    }
    reset() {
        this.timers = [];
        this.currentTime = 0;
    }
}
exports.MockTimer = MockTimer;
/**
 * Test data generators
 */
exports.TestData = {
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
    randomAmount: (min = 1, max = 1000) => Math.floor(Math.random() * (max - min + 1)) + min
};
/**
 * Snapshot comparison helper
 */
function createSnapshot(data) {
    return JSON.stringify(data, null, 2);
}
/**
 * Deep clone helper for test data
 */
function cloneTestData(data) {
    return JSON.parse(JSON.stringify(data));
}
