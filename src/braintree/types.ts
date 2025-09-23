/**
 * Braintree-specific Types
 */

import { PaymentMethod, PaymentResult } from '../core/types';

export interface BraintreePaymentMethodNonce {
  nonce: string;
  type: string;
  description?: string;
  details?: {
    lastTwo?: string;
    lastFour?: string;
    cardType?: string;
    expirationMonth?: string;
    expirationYear?: string;
    bin?: string;
  };
}

export interface BraintreeDropinInstance {
  requestPaymentMethod(): Promise<BraintreePaymentMethodNonce>;
  clearSelectedPaymentMethod(): void;
  isPaymentMethodRequestable(): boolean;
  updateConfiguration(property: string, value: any): void;
  teardown(): Promise<void>;
}

export interface BraintreeError {
  type: string;
  code: string;
  message: string;
  details?: any;
}

export interface BraintreeDropinOptions {
  authorization: string;
  container: string | HTMLElement;
  paypal?: {
    flow: 'checkout' | 'vault';
    amount?: string;
    currency?: string;
    locale?: string;
    enableShippingAddress?: boolean;
    shippingAddressEditable?: boolean;
  };
  applePay?: {
    displayName: string;
    paymentRequest: {
      total: {
        label: string;
        amount: string;
      };
      requiredBillingContactFields?: string[];
      requiredShippingContactFields?: string[];
    };
  };
  googlePay?: {
    merchantId: string;
    transactionInfo: {
      totalPriceStatus: 'FINAL' | 'ESTIMATED';
      totalPrice: string;
      currencyCode: string;
    };
  };
  venmo?: {
    allowDesktop?: boolean;
  };
  card?: {
    overrides?: {
      fields?: Record<string, any>;
    };
  };
  threeDSecure?: boolean;
  vaultManager?: boolean;
  preselectVaultedPaymentMethod?: boolean;
}

export interface BraintreePaymentResult extends PaymentResult {
  nonce?: string;
  deviceData?: string;
}

export interface BraintreeClientTokenResponse {
  clientToken: string;
  environment: 'sandbox' | 'production';
  merchantId?: string;
}

declare global {
  interface Window {
    braintree?: {
      dropin: {
        create: (
          options: BraintreeDropinOptions,
          callback: (error: BraintreeError | null, instance: BraintreeDropinInstance | null) => void
        ) => void;
      };
      client: {
        create: (options: { authorization: string }) => Promise<any>;
      };
      dataCollector: {
        create: (options: { client: any; paypal?: boolean }) => Promise<{ deviceData: string }>;
      };
    };
  }
}