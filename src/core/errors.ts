/**
 * Universal Payment Errors
 * Standardized error handling for all payment gateways
 */

export enum PaymentErrorCode {
  // General errors
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Payment processing errors
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_CARD = 'INVALID_CARD',
  EXPIRED_CARD = 'EXPIRED_CARD',
  PROCESSING_ERROR = 'PROCESSING_ERROR',

  // Gateway specific errors
  STRIPE_ERROR = 'STRIPE_ERROR',
  BRAINTREE_ERROR = 'BRAINTREE_ERROR',
  AUTHORIZE_NET_ERROR = 'AUTHORIZE_NET_ERROR',

  // Security errors
  SECURITY_ERROR = 'SECURITY_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',

  // Timeout errors
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // Unknown error
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface PaymentErrorDetails {
  code: PaymentErrorCode;
  message: string;
  gateway?: string;
  originalError?: unknown;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Standardized Payment Error Class
 */
export class PaymentError extends Error {
  public readonly code: PaymentErrorCode;
  public readonly gateway?: string;
  public readonly originalError?: unknown;
  public readonly timestamp: Date;
  public readonly metadata?: Record<string, any>;

  constructor(details: PaymentErrorDetails) {
    super(details.message);
    this.name = 'PaymentError';
    this.code = details.code;
    this.gateway = details.gateway;
    this.originalError = details.originalError;
    this.timestamp = details.timestamp;
    this.metadata = details.metadata;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PaymentError);
    }
  }

  /**
   * Convert to plain object for logging/serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      gateway: this.gateway,
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata,
      stack: this.stack
    };
  }

  /**
   * Create user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case PaymentErrorCode.PAYMENT_DECLINED:
        return 'Your payment was declined. Please try a different payment method.';
      case PaymentErrorCode.INSUFFICIENT_FUNDS:
        return 'Insufficient funds. Please try a different payment method.';
      case PaymentErrorCode.INVALID_CARD:
        return 'Please check your card details and try again.';
      case PaymentErrorCode.EXPIRED_CARD:
        return 'Your card has expired. Please use a different payment method.';
      case PaymentErrorCode.NETWORK_ERROR:
        return 'Network error. Please check your connection and try again.';
      case PaymentErrorCode.TIMEOUT_ERROR:
        return 'Request timed out. Please try again.';
      case PaymentErrorCode.CONFIGURATION_ERROR:
        return 'Payment system configuration error. Please contact support.';
      default:
        return 'An error occurred while processing your payment. Please try again.';
    }
  }
}

/**
 * Helper function to create standardized payment errors
 */
export function createPaymentError(
  code: PaymentErrorCode,
  message: string,
  gateway?: string,
  originalError?: unknown,
  metadata?: Record<string, any>
): PaymentError {
  return new PaymentError({
    code,
    message,
    gateway,
    originalError,
    timestamp: new Date(),
    metadata
  });
}

/**
 * Helper function to normalize errors from different gateways
 */
export function normalizeGatewayError(
  error: unknown,
  gateway: string
): PaymentError {
  // If it's already a PaymentError, return it
  if (error instanceof PaymentError) {
    return error;
  }

  // Handle different types of errors
  if (error instanceof Error) {
    // Network/timeout errors
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return createPaymentError(
        PaymentErrorCode.TIMEOUT_ERROR,
        'Request timed out',
        gateway,
        error
      );
    }

    // Network errors
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return createPaymentError(
        PaymentErrorCode.NETWORK_ERROR,
        'Network connection error',
        gateway,
        error
      );
    }

    // Gateway-specific error mapping
    let code: PaymentErrorCode;
    switch (gateway.toLowerCase()) {
      case 'stripe':
        code = PaymentErrorCode.STRIPE_ERROR;
        break;
      case 'braintree':
        code = PaymentErrorCode.BRAINTREE_ERROR;
        break;
      case 'authorize.net':
      case 'authorizenet':
        code = PaymentErrorCode.AUTHORIZE_NET_ERROR;
        break;
      default:
        code = PaymentErrorCode.PROCESSING_ERROR;
    }

    return createPaymentError(
      code,
      error.message,
      gateway,
      error
    );
  }

  // Handle string errors
  if (typeof error === 'string') {
    return createPaymentError(
      PaymentErrorCode.PROCESSING_ERROR,
      error,
      gateway,
      error
    );
  }

  // Handle unknown errors
  return createPaymentError(
    PaymentErrorCode.UNKNOWN_ERROR,
    'An unknown error occurred',
    gateway,
    error
  );
}

/**
 * Sanitize error for logging (remove sensitive data)
 */
export function sanitizeErrorForLogging(error: PaymentError): Record<string, any> {
  const sanitized = error.toJSON();

  // Remove potentially sensitive data
  if (sanitized.metadata) {
    const { cardNumber, cvv, ssn, ...safeMeta } = sanitized.metadata;
    sanitized.metadata = safeMeta;
  }

  return sanitized;
}