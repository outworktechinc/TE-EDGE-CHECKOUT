/**
 * Universal Payments NextJS Package
 * Main export file
 */

// Types
export * from './types/payment';

// Services
export { PaymentProcessingService } from './services/PaymentProcessingService';
export { StripeService } from './services/StripeService';

// Components
export { PaymentProcessor } from './components/PaymentProcessor';
export { StripeCheckout } from './components/StripeCheckout';
export { BraintreeDropIn } from './components/BraintreeDropIn';
export { AuthorizeNetForm } from './components/AuthorizeNetForm';

// Stores & Hooks
export {
  usePaymentMethodStore,
  useSelectedPaymentMethod,
  useAvailablePaymentMethods,
  usePaymentProcessingState,
  usePaymentError
} from './stores/usePaymentMethodStore';

// Re-export types for convenience
export type {
  PaymentProvider,
  PaymentMethodData,
  PaymentProcessingResult,
  StripePaymentResult,
  PaymentGatewayConfig
} from './types/payment';

export type { PaymentMethodState } from './stores/usePaymentMethodStore';