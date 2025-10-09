/**
 * Braintree Payment Gateway Integration
 * Framework-agnostic implementation
 */
import { CardInput, EnvironmentAdapter } from "../types";
/**
 * Initialize Braintree SDK
 */
export declare function initializeBraintree(adapter: EnvironmentAdapter): Promise<void>;
/**
 * Create payment method nonce from card details
 */
export declare function createBraintreeToken(card: CardInput, adapter: EnvironmentAdapter): Promise<string>;
/**
 * Reset Braintree instance
 */
export declare function resetBraintree(): void;
/**
 * Check if Braintree is ready
 */
export declare function isBraintreeReady(): boolean;
//# sourceMappingURL=braintree.d.ts.map