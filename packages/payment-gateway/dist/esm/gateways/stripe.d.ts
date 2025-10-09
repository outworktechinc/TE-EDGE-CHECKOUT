/**
 * Stripe Payment Gateway Integration
 * Framework-agnostic implementation
 */
import { CardInput, EnvironmentAdapter } from "../types";
/**
 * Initialize Stripe SDK
 */
export declare function initializeStripe(adapter: EnvironmentAdapter): Promise<void>;
/**
 * Create payment method token from card details
 *
 * For Edge Checkout scenarios, this calls the backend API endpoint
 * since Stripe doesn't allow raw card data from browser with publishable key
 */
export declare function createStripeToken(card: CardInput, adapter: EnvironmentAdapter): Promise<string>;
/**
 * Reset Stripe instance
 */
export declare function resetStripe(): void;
/**
 * Check if Stripe is ready
 */
export declare function isStripeReady(): boolean;
//# sourceMappingURL=stripe.d.ts.map