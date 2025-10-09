/**
 * Stripe Session Management
 * Handles Stripe Checkout Session creation and redirect flows
 */
import { StripeSessionRequest, StripeSessionResponse, EnvironmentAdapter } from '../types';
/**
 * Create Stripe Checkout Session
 * Calls backend API to create a session
 */
export declare function createStripeSession(request: StripeSessionRequest, adapter: EnvironmentAdapter): Promise<StripeSessionResponse>;
/**
 * Redirect to Stripe Checkout
 */
export declare function redirectToStripeCheckout(url: string): void;
/**
 * Extract session ID from Stripe redirect URL
 * After successful payment, Stripe redirects back with session_id in query params
 */
export declare function extractSessionIdFromUrl(url?: string): string | null;
/**
 * Check if URL contains Stripe session success
 */
export declare function isStripeSuccessUrl(url?: string): boolean;
/**
 * Check if URL contains Stripe cancellation
 */
export declare function isStripeCancelUrl(url?: string): boolean;
/**
 * Retrieve Stripe session details from backend
 */
export declare function retrieveStripeSession(sessionId: string, adapter: EnvironmentAdapter): Promise<any>;
/**
 * Validate Stripe session request
 */
export declare function validateSessionRequest(request: StripeSessionRequest): {
    isValid: boolean;
    errors: string[];
};
/**
 * Format amount for Stripe (convert to cents)
 */
export declare function formatAmountForStripe(amount: number, currency?: string): number;
/**
 * Parse amount from Stripe (convert from cents)
 */
export declare function parseAmountFromStripe(amount: number, currency?: string): number;
//# sourceMappingURL=stripe-session.d.ts.map