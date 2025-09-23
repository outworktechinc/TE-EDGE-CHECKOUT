/**
 * Stripe-specific Types
 */

import { PaymentRequest, PaymentResult } from '../core/types';

export interface StripeCheckoutSessionData {
  amount: number;
  currency?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  payment_status: string;
  customer_email?: string;
  amount_total?: number;
  currency?: string;
}

export interface StripePaymentResult extends PaymentResult {
  sessionId?: string;
  checkoutUrl?: string;
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface StripeError {
  type: string;
  code?: string;
  message: string;
  param?: string;
}