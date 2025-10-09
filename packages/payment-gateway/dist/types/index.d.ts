/**
 * Payment Gateway Type Definitions
 * Framework-agnostic types for payment processing
 */
export type GatewayName = "Stripe" | "Braintree" | "Authorize.Net";
export interface CardInput {
    number: string;
    expMonth: string;
    expYear: string;
    cvc: string;
}
export interface TokenResult {
    token: string;
    gatewayName: GatewayName;
}
export interface GatewayReadyResult {
    ready: true;
    gatewayName: GatewayName;
}
/**
 * Configuration for gateway credentials
 * Pass these when initializing the library in your application
 */
export interface GatewayConfig {
    stripePublishableKey?: string;
    authorizeNetClientKey?: string;
    authorizeNetApiLoginId?: string;
    braintreeClientTokenUrl?: string;
    apiBaseUrl?: string;
}
/**
 * Environment adapter for framework-specific implementations
 * Each framework provides its own implementation
 */
export interface EnvironmentAdapter {
    /**
     * Get configuration value
     */
    getConfig(key: keyof GatewayConfig): string | undefined;
    /**
     * Check if running in browser
     */
    isBrowser(): boolean;
    /**
     * Make HTTP request
     */
    fetch(url: string, options?: RequestInit): Promise<Response>;
}
/**
 * Payment Error Codes
 */
export declare enum PaymentErrorCode {
    DETECTION_FAILED = "DETECTION_FAILED",
    SDK_LOAD_FAILED = "SDK_LOAD_FAILED",
    INVALID_CARD = "INVALID_CARD",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    TOKENIZATION_FAILED = "TOKENIZATION_FAILED",
    CLIENT_TOKEN_FAILED = "CLIENT_TOKEN_FAILED",
    NOT_SUPPORTED = "NOT_SUPPORTED",
    NOT_READY = "NOT_READY",
    NETWORK_ERROR = "NETWORK_ERROR",
    CONFIG_MISSING = "CONFIG_MISSING"
}
export declare class PaymentError extends Error {
    code: PaymentErrorCode;
    details?: unknown | undefined;
    constructor(code: PaymentErrorCode, message: string, details?: unknown | undefined);
}
/**
 * Stripe SDK Types
 */
export interface StripeInstance {
    createPaymentMethod(params: {
        type: string;
        card: {
            number: string;
            exp_month: string;
            exp_year: string;
            cvc: string;
        };
    }): Promise<{
        paymentMethod?: {
            id: string;
        };
        error?: {
            message: string;
        };
    }>;
}
/**
 * Braintree SDK Types
 */
export interface BraintreeClientInstance {
    request(params: {
        endpoint: string;
        method: string;
        data: unknown;
    }): Promise<any>;
}
/**
 * Authorize.Net SDK Types
 */
export interface AuthNetCardData {
    cardNumber: string;
    month: string;
    year: string;
    cardCode: string;
}
export interface AuthNetAuthData {
    clientKey: string;
    apiLoginID: string;
}
export interface AuthNetResponse {
    messages: {
        resultCode: string;
        message: Array<{
            code: string;
            text: string;
        }>;
    };
    opaqueData?: {
        dataDescriptor: string;
        dataValue: string;
    };
}
export interface AuthNetAccept {
    dispatchData(data: {
        authData: AuthNetAuthData;
        cardData: AuthNetCardData;
    }, callback: (response: AuthNetResponse) => void): void;
}
declare global {
    interface Window {
        Stripe?: (key: string) => StripeInstance;
        braintree?: {
            client?: {
                create(options: {
                    authorization: string;
                }): Promise<BraintreeClientInstance>;
            };
        };
        Accept?: AuthNetAccept;
    }
}
/**
 * Payment Method Types
 */
export type PaymentMethod = "Stripe" | "Edge Checkout" | "Hosted Checkout";
/**
 * Gateway Detection API Response
 */
export interface GatewayDetectionResponse {
    Status: boolean;
    msgCode: string;
    message: string;
    data: {
        gatewayName: GatewayName;
        paymentThrough: PaymentMethod;
        redirectUrl: {
            isAvailable: boolean;
            url?: string;
        };
    };
    Token: string | null;
}
/**
 * Payment Configuration Result
 */
export interface PaymentConfiguration {
    gatewayName: GatewayName;
    paymentMethod: PaymentMethod;
    requiresRedirect: boolean;
    redirectUrl?: string;
    scenario: 'stripe-session' | 'stripe-redirect' | 'braintree-edge' | 'authorizenet-edge';
    tokenType: 'sessionId' | 'nonce' | 'rawCard';
}
/**
 * Stripe Session Creation Request
 */
export interface StripeSessionRequest {
    amount: number;
    currency?: string;
    successUrl?: string;
    cancelUrl?: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
}
/**
 * Stripe Session Response
 */
export interface StripeSessionResponse {
    sessionId: string;
    url?: string;
}
//# sourceMappingURL=index.d.ts.map