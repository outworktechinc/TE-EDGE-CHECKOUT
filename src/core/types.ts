/**
 * Universal Payment Core Types
 * Shared types across all payment gateways
 */

import { PaymentError } from './errors';

/**
 * Payment providers supported by the package
 */
export type PaymentProvider = 'stripe' | 'braintree' | 'authorize.net';

/**
 * Payment method types
 */
export type PaymentMethodType = 'card' | 'paypal' | 'bank_transfer' | 'digital_wallet';

/**
 * Currency codes (ISO 4217)
 */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

/**
 * Payment status types
 */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'requires_action'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded';

/**
 * Payment intent data structure
 */
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: CurrencyCode;
  status: PaymentStatus;
  description?: string;
  metadata?: Record<string, any>;
  created: Date;
  updated: Date;
}

/**
 * Payment method data structure
 */
export interface PaymentMethod {
  id: string;
  provider: PaymentProvider;
  type: PaymentMethodType;
  token: string; // Gateway-specific token/nonce
  last4?: string;
  brand?: string;
  expiryMonth?: string;
  expiryYear?: string;
  holderName?: string;
  isDefault: boolean;
  created: Date;
  metadata?: Record<string, any>;
}

/**
 * Billing address information
 */
export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Customer information
 */
export interface Customer {
  id?: string;
  email?: string;
  name?: string;
  phone?: string;
  billingAddress?: BillingAddress;
  metadata?: Record<string, any>;
}

/**
 * Payment request data structure
 */
export interface PaymentRequest {
  amount: number;
  currency: CurrencyCode;
  description?: string;
  customer?: Customer;
  paymentMethod?: string; // Payment method ID or token
  captureMethod?: 'automatic' | 'manual';
  confirmationMethod?: 'automatic' | 'manual';
  returnUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Payment result data structure
 */
export interface PaymentResult {
  success: boolean;
  paymentIntent?: PaymentIntent;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  redirectUrl?: string;
  error?: PaymentError;
  metadata?: Record<string, any>;
}

/**
 * Refund request data structure
 */
export interface RefundRequest {
  paymentIntentId: string;
  amount?: number; // Partial refund if specified
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Refund result data structure
 */
export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  status?: 'pending' | 'succeeded' | 'failed';
  error?: PaymentError;
  metadata?: Record<string, any>;
}

/**
 * Webhook event data structure
 */
export interface WebhookEvent {
  id: string;
  type: string;
  provider: PaymentProvider;
  data: Record<string, any>;
  created: Date;
  processed: boolean;
}

/**
 * Payment gateway capabilities
 */
export interface GatewayCapabilities {
  supportedPaymentMethods: PaymentMethodType[];
  supportedCurrencies: CurrencyCode[];
  supportsRefunds: boolean;
  supportsPartialRefunds: boolean;
  supportsRecurring: boolean;
  supportsWebhooks: boolean;
  supportsManualCapture: boolean;
  minimumAmount: number;
  maximumAmount?: number;
}

/**
 * Gateway interface that all payment gateways must implement
 */
export interface PaymentGateway {
  readonly provider: PaymentProvider;
  readonly capabilities: GatewayCapabilities;

  /**
   * Initialize the gateway with configuration
   */
  initialize(config: any): Promise<void>;

  /**
   * Create a payment intent
   */
  createPaymentIntent(request: PaymentRequest): Promise<PaymentResult>;

  /**
   * Confirm a payment intent
   */
  confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentResult>;

  /**
   * Capture a payment (for manual capture)
   */
  capturePayment(paymentIntentId: string, amount?: number): Promise<PaymentResult>;

  /**
   * Create a payment method
   */
  createPaymentMethod(data: any): Promise<PaymentMethod>;

  /**
   * Process a refund
   */
  refundPayment(request: RefundRequest): Promise<RefundResult>;

  /**
   * Retrieve payment details
   */
  getPaymentDetails(paymentIntentId: string): Promise<PaymentResult>;

  /**
   * Handle webhook events
   */
  processWebhook(event: WebhookEvent): Promise<void>;

  /**
   * Clean up resources
   */
  cleanup(): void;
}

/**
 * Payment form validation rules
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationRules {
  cardNumber?: ValidationRule;
  expiryMonth?: ValidationRule;
  expiryYear?: ValidationRule;
  cvv?: ValidationRule;
  holderName?: ValidationRule;
  [key: string]: ValidationRule | undefined;
}

/**
 * Payment form field data
 */
export interface PaymentFormData {
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  holderName?: string;
  email?: string;
  billingAddress?: BillingAddress;
  savePaymentMethod?: boolean;
}

/**
 * Payment form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Component props interfaces
 */
export interface BasePaymentComponentProps {
  amount: number;
  currency?: CurrencyCode;
  customer?: Customer;
  onSuccess: (result: PaymentResult) => void;
  onError: (error: PaymentError) => void;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Gateway-specific component props
 */
export interface GatewayComponentProps extends BasePaymentComponentProps {
  config: any; // Gateway-specific configuration
  customization?: any; // Gateway-specific customization options
}

/**
 * Logging interface
 */
export interface Logger {
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

/**
 * Analytics event interface
 */
export interface AnalyticsEvent {
  event: string;
  provider: PaymentProvider;
  amount?: number;
  currency?: CurrencyCode;
  success?: boolean;
  errorCode?: string;
  duration?: number;
  metadata?: Record<string, any>;
}