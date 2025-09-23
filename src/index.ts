/**
 * Universal Payments NextJS Package
 * Tree-shakable modular exports following industry standards
 */

// ===== CORE EXPORTS =====
// Main payment processor
export { PaymentProcessor } from './core/PaymentProcessor';

// Core types and interfaces
export type {
  PaymentProvider,
  PaymentMethodType,
  CurrencyCode,
  PaymentStatus,
  PaymentIntent,
  PaymentMethod,
  PaymentRequest,
  PaymentResult,
  Customer,
  BillingAddress,
  RefundRequest,
  RefundResult,
  PaymentGateway,
  GatewayCapabilities,
  BasePaymentComponentProps,
  GatewayComponentProps,
  ValidationResult,
  PaymentFormData,
  Logger,
  AnalyticsEvent
} from './core/types';

// Configuration system
export {
  PaymentConfigBuilder,
  EnvironmentConfigHelper,
  createStripeConfig,
  createBraintreeConfig,
  createAuthorizeNetConfig
} from './core/config';

export type {
  Environment,
  PaymentGateway as PaymentGatewayType,
  PaymentConfig,
  StripeConfig,
  BraintreeConfig,
  AuthorizeNetConfig,
  BasePaymentConfig
} from './core/config';

// Error handling
export {
  PaymentError,
  PaymentErrorCode,
  createPaymentError,
  normalizeGatewayError,
  sanitizeErrorForLogging
} from './core/errors';

// ===== GATEWAY-SPECIFIC EXPORTS =====
// Stripe module
export { StripeService, StripeCheckout } from './stripe';
export type {
  StripeCheckoutSessionData,
  StripeCheckoutSession,
  StripePaymentResult,
  StripePaymentMethod,
  StripeError
} from './stripe';

// Braintree module
export { BraintreeService } from './braintree';
export type {
  BraintreePaymentMethodNonce,
  BraintreeDropinInstance,
  BraintreeError,
  BraintreeDropinOptions,
  BraintreePaymentResult,
  BraintreeClientTokenResponse
} from './braintree';

// Authorize.Net module
export { AuthorizeNetService } from './authorizeNet';

// ===== UTILITIES =====
// Validation utilities
export {
  CardValidator,
  isValidEmail,
  isValidPhone,
  isValidPostalCode,
  formatCardNumber,
  formatExpiryDate,
  validateField,
  validatePaymentForm,
  sanitizePaymentFormData
} from './utils/validation';

export type {
  ValidationRule,
  ValidationRules
} from './core/types';

// Logging utilities
export { PaymentLogger, logger, createGatewayLogger } from './utils/logger';
export type { LogLevel } from './utils/logger';

// ===== LEGACY COMPATIBILITY =====
// Stores & Hooks (re-export existing for backward compatibility)
export {
  usePaymentMethodStore,
  useSelectedPaymentMethod,
  useAvailablePaymentMethods,
  usePaymentProcessingState,
  usePaymentError
} from './stores/usePaymentMethodStore';

export type { PaymentMethodState } from './stores/usePaymentMethodStore';

// Legacy services (for backward compatibility)
export { PaymentProcessingService } from './services/PaymentProcessingService';
export { StripeService as LegacyStripeService } from './services/StripeService';

// Legacy components (for backward compatibility)
export { PaymentProcessor as LegacyPaymentProcessor } from './components/PaymentProcessor';
export { StripeCheckout as LegacyStripeCheckout } from './components/StripeCheckout';
export { BraintreeDropIn as LegacyBraintreeDropIn } from './components/BraintreeDropIn';
export { AuthorizeNetForm as LegacyAuthorizeNetForm } from './components/AuthorizeNetForm';

// Legacy types (for backward compatibility)
export type {
  PaymentMethodNonce,
  BraintreeInstance,
  BraintreeError as LegacyBraintreeError,
  AuthorizeNetCardData,
  AuthorizeNetAuthData,
  AuthorizeNetResponse,
  PaymentProcessingResult,
  StripeCheckoutSessionData as LegacyStripeCheckoutSessionData,
  StripeCheckoutSession as LegacyStripeCheckoutSession,
  StripePaymentResult as LegacyStripePaymentResult,
  PaymentGatewayConfig,
  PaymentMethodData
} from './types/payment';