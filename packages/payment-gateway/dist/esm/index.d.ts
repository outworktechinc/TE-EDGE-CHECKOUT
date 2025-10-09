/**
 * Framework-Agnostic Payment Gateway Library
 *
 * Supports Stripe, Braintree, and Authorize.Net
 * Works with Next.js, Angular, React, and any JavaScript framework
 */
import { GatewayName, CardInput, TokenResult, GatewayReadyResult, EnvironmentAdapter } from "./types";
import { LogLevel } from "./utils/logger";
import { PaymentEventEmitter } from "./utils/events";
import { RetryOptions } from "./utils/retry";
import type { PaymentConfiguration, StripeSessionRequest, StripeSessionResponse, GatewayDetectionResponse } from "./types";
/**
 * Payment Gateway Manager
 * Main class for managing payment gateway operations
 */
export declare class PaymentGatewayManager {
    private adapter;
    private storage;
    private readinessPromises;
    private paymentConfig;
    /**
     * Event emitter for payment lifecycle events
     */
    events: PaymentEventEmitter;
    /**
     * Enable/disable card validation
     */
    validateCards: boolean;
    /**
     * Enable/disable retry logic
     */
    enableRetry: boolean;
    /**
     * Retry options
     */
    retryOptions: RetryOptions;
    /**
     * Auto-detect gateway on initialization
     */
    autoDetectGateway: boolean;
    constructor(adapter: EnvironmentAdapter, options?: {
        autoDetectGateway?: boolean;
    });
    /**
     * Initialize gateway SDK
     */
    private initializeGatewaySDK;
    /**
     * Set active gateway
     */
    setActiveGateway(gatewayName: GatewayName): void;
    /**
     * Get active gateway
     */
    getActiveGateway(): GatewayName | null;
    /**
     * Ensure gateway is ready
     */
    ensureGatewayReady(gatewayName: GatewayName): Promise<GatewayReadyResult>;
    /**
     * Create payment token from card details
     */
    createPaymentToken(card: CardInput, gatewayName: GatewayName): Promise<TokenResult>;
    /**
     * Check if gateway is ready
     */
    isGatewayReady(gatewayName: GatewayName): boolean;
    /**
     * Clear all payment context
     */
    clearPaymentContext(): Promise<void>;
    /**
     * Set log level
     */
    setLogLevel(level: LogLevel): void;
    /**
     * Get transaction logs
     */
    getLogs(): string;
    /**
     * Get transaction stats
     */
    getStats(): {
        total: number;
        byLevel: Record<string, number>;
        byGateway: Record<string, number>;
    };
    /**
     * Detect active payment gateway from backend
     * Should be called at application startup
     */
    detectGateway(): Promise<PaymentConfiguration>;
    /**
     * Get current payment configuration
     */
    getPaymentConfiguration(): PaymentConfiguration | null;
    /**
     * Manually set payment configuration (alternative to detectGateway)
     */
    setPaymentConfiguration(response: GatewayDetectionResponse): PaymentConfiguration;
    /**
     * Create Stripe checkout session
     * For scenario A: Stripe with session-based checkout
     */
    createStripeCheckoutSession(request: StripeSessionRequest): Promise<StripeSessionResponse>;
    /**
     * Extract session ID from URL after Stripe redirect
     * For scenario B: Stripe with redirect
     */
    extractStripeSessionId(url?: string): string | null;
    /**
     * Check if current URL is Stripe success redirect
     */
    isStripeSuccessRedirect(url?: string): boolean;
    /**
     * Check if current URL is Stripe cancel redirect
     */
    isStripeCancelRedirect(url?: string): boolean;
    /**
     * Get payment method token based on current scenario
     * This is the main method applications should use
     */
    getPaymentMethodToken(input?: {
        card?: CardInput;
        amount?: number;
        sessionRequest?: StripeSessionRequest;
    }): Promise<{
        token: string;
        tokenType: string;
        gatewayName: GatewayName;
    }>;
    /**
     * Check if Edge Checkout UI is required
     */
    requiresEdgeCheckout(): boolean;
    /**
     * Check if Stripe redirect is required
     */
    requiresStripeRedirect(): boolean;
}
/**
 * Export types and utilities
 */
export type { GatewayName, CardInput, TokenResult, GatewayReadyResult, GatewayConfig, EnvironmentAdapter } from "./types";
export { PaymentError, PaymentErrorCode } from "./types";
export * from "./utils/card-validation";
export * from "./utils/address-validation";
export * from "./utils/currency";
export * from "./utils/logger";
export * from "./utils/events";
export * from "./utils/retry";
export * from "./utils/three-d-secure";
export * from "./utils/card-icons";
export * from "./utils/gateway-detection";
export * from "./utils/stripe-session";
export * from "./test-utils";
export type { PaymentMethod, PaymentConfiguration, GatewayDetectionResponse, StripeSessionRequest, StripeSessionResponse } from "./types";
export default PaymentGatewayManager;
//# sourceMappingURL=index.d.ts.map