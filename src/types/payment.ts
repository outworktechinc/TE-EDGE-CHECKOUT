/**
 * Universal Payment Types
 * Extracted and adapted from the Ombee Mobile implementation
 */

export type PaymentProvider = 'stripe' | 'braintree' | 'authorize_net';

export interface PaymentMethodData {
  id: string;
  provider: PaymentProvider;
  nonce: string;
  last4?: string;
  brand?: string;
  expiryMonth?: string;
  expiryYear?: string;
  isDefault: boolean;
  createdAt: Date;
}

// Core payment processing interfaces
export interface PaymentMethodNonce {
  nonce: string;
  type: string;
  description?: string;
  details?: any;
}

export interface BraintreeInstance {
  requestPaymentMethod(): Promise<PaymentMethodNonce>;
  clearSelectedPaymentMethod(): void;
  isPaymentMethodRequestable(): boolean;
}

export interface BraintreeError {
  type: string;
  code: string;
  message: string;
}

export interface AuthorizeNetCardData {
  cardNumber: string;
  month: string;
  year: string;
  cardCode: string;
}

export interface AuthorizeNetAuthData {
  clientKey: string;
  apiLoginID: string;
}

export interface AuthorizeNetResponse {
  messages: {
    resultCode: string;
    message: Array<{ code: string; text: string }>;
  };
  opaqueData?: {
    dataDescriptor: string;
    dataValue: string;
  };
}

export interface PaymentProcessingResult {
  success: boolean;
  paymentMethodId?: string;
  error?: string;
  details?: any;
}

// Stripe specific types
export interface StripeCheckoutSessionData {
  amount: number;
  currency?: string;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  payment_status: string;
}

export interface StripePaymentResult {
  success: boolean;
  sessionId?: string;
  error?: string;
  details?: any;
}

// Gateway configuration
export interface PaymentGatewayConfig {
  gatewayName: string;
  apiBaseUrl: string;
  environment?: 'development' | 'production';
}

// Global window declarations
declare global {
  interface Window {
    braintree: {
      dropin: {
        create: (options: any, callback: (error: BraintreeError | null, instance: BraintreeInstance | null) => void) => void;
      };
    };
    Accept: {
      dispatchData: (data: { authData: AuthorizeNetAuthData; cardData: AuthorizeNetCardData }, callback: (response: AuthorizeNetResponse) => void) => void;
    };
  }
}