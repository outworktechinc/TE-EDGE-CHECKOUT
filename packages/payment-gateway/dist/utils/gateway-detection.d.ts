/**
 * Gateway Detection Utilities
 * Detects active payment gateway from backend API
 */
import { GatewayDetectionResponse, PaymentConfiguration, EnvironmentAdapter } from '../types';
/**
 * Detect active gateway from backend API
 * Calls /api/integration/getDefaultSubscriptionType
 */
export declare function detectActiveGateway(adapter: EnvironmentAdapter): Promise<PaymentConfiguration>;
/**
 * Determine payment scenario based on API response
 */
export declare function determinePaymentScenario(response: GatewayDetectionResponse): PaymentConfiguration;
/**
 * Check if Stripe redirect is required
 */
export declare function requiresStripeRedirect(config: PaymentConfiguration): boolean;
/**
 * Check if Edge Checkout is required
 */
export declare function requiresEdgeCheckout(config: PaymentConfiguration): boolean;
/**
 * Get expected token type for configuration
 */
export declare function getExpectedTokenType(config: PaymentConfiguration): 'sessionId' | 'nonce' | 'rawCard';
/**
 * Validate payment configuration
 */
export declare function validatePaymentConfiguration(config: PaymentConfiguration): {
    isValid: boolean;
    errors: string[];
};
/**
 * Format configuration for display/logging
 */
export declare function formatConfigurationSummary(config: PaymentConfiguration): string;
//# sourceMappingURL=gateway-detection.d.ts.map