/**
 * Testing Utilities
 * Helpers for testing payment integrations
 */
import { GatewayName, CardInput, EnvironmentAdapter, GatewayConfig } from './types';
/**
 * Test card numbers for each gateway
 */
export declare const TEST_CARDS: {
    stripe: {
        success: string;
        decline: string;
        insufficientFunds: string;
        lostCard: string;
        stolenCard: string;
        expiredCard: string;
        incorrectCVC: string;
        processingError: string;
        requiresAuthentication: string;
    };
    braintree: {
        success: string;
        decline: string;
        processorDecline: string;
        fraudDecline: string;
        processingError: string;
    };
    authorizenet: {
        success: string;
        decline: string;
        insufficientFunds: string;
        invalidExpiryDate: string;
        processingError: string;
    };
};
/**
 * Get test card for specific scenario
 */
export declare function getTestCard(gateway: GatewayName, scenario?: keyof typeof TEST_CARDS.stripe): CardInput;
/**
 * Get all test cards for a gateway
 */
export declare function getAllTestCards(gateway: GatewayName): Record<string, CardInput>;
/**
 * Create mock environment adapter for testing
 */
export declare function createMockAdapter(config?: Partial<GatewayConfig>): EnvironmentAdapter;
/**
 * Create mock adapter with custom fetch behavior
 */
export declare function createMockAdapterWithFetch(fetchMock: (url: string, options?: RequestInit) => Promise<Response>, config?: Partial<GatewayConfig>): EnvironmentAdapter;
/**
 * Mock fetch that fails
 */
export declare function failingFetch(_url: string, _options?: RequestInit): Promise<Response>;
/**
 * Mock fetch that times out
 */
export declare function timeoutFetch(_url: string, _options?: RequestInit): Promise<Response>;
/**
 * Generate random test card details
 */
export declare function generateRandomCard(gateway?: GatewayName): CardInput;
/**
 * Validate test environment setup
 */
export declare function validateTestEnvironment(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * Wait for condition (useful for async tests)
 */
export declare function waitFor(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<void>;
/**
 * Mock timer helpers
 */
export declare class MockTimer {
    private timers;
    private currentTime;
    setTimeout(callback: () => void, delay: number): number;
    clearTimeout(id: number): void;
    tick(ms: number): void;
    tickAsync(ms: number): Promise<void>;
    reset(): void;
}
/**
 * Test data generators
 */
export declare const TestData: {
    /**
     * Generate random billing address
     */
    randomAddress: () => {
        firstName: string;
        lastName: string;
        address: string;
        address2: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    /**
     * Generate random email
     */
    randomEmail: () => string;
    /**
     * Generate random phone
     */
    randomPhone: () => string;
    /**
     * Generate random amount
     */
    randomAmount: (min?: number, max?: number) => number;
};
/**
 * Snapshot comparison helper
 */
export declare function createSnapshot<T>(data: T): string;
/**
 * Deep clone helper for test data
 */
export declare function cloneTestData<T>(data: T): T;
//# sourceMappingURL=test-utils.d.ts.map