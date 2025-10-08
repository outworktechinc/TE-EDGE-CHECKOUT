/**
 * Stripe Session Management
 * Handles Stripe Checkout Session creation and redirect flows
 */

import {
  StripeSessionRequest,
  StripeSessionResponse,
  EnvironmentAdapter,
  PaymentError,
  PaymentErrorCode
} from '../types';
import { logger } from './logger';

/**
 * Create Stripe Checkout Session
 * Calls backend API to create a session
 */
export async function createStripeSession(
  request: StripeSessionRequest,
  adapter: EnvironmentAdapter
): Promise<StripeSessionResponse> {
  const apiBaseUrl = adapter.getConfig('apiBaseUrl');

  if (!apiBaseUrl) {
    throw new PaymentError(
      PaymentErrorCode.CONFIG_MISSING,
      'apiBaseUrl is required for Stripe session creation'
    );
  }

  try {
    logger.info('Creating Stripe checkout session...', {
      amount: request.amount,
      currency: request.currency || 'USD'
    });

    const response = await adapter.fetch(
      `${apiBaseUrl}/api/payments/stripe/create-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency || 'USD',
          successUrl: request.successUrl,
          cancelUrl: request.cancelUrl,
          customerEmail: request.customerEmail,
          metadata: request.metadata
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new PaymentError(
        PaymentErrorCode.TOKENIZATION_FAILED,
        errorData.message || `Failed to create Stripe session: ${response.status}`,
        errorData
      );
    }

    const data = await response.json();

    if (!data.sessionId) {
      throw new PaymentError(
        PaymentErrorCode.TOKENIZATION_FAILED,
        'Invalid response: sessionId missing'
      );
    }

    logger.info('Stripe session created successfully', {
      sessionId: data.sessionId.substring(0, 20) + '...'
    });

    return {
      sessionId: data.sessionId,
      url: data.url
    };
  } catch (error) {
    if (error instanceof PaymentError) {
      throw error;
    }

    logger.error('Failed to create Stripe session', error);
    throw new PaymentError(
      PaymentErrorCode.TOKENIZATION_FAILED,
      'Failed to create Stripe checkout session',
      error
    );
  }
}

/**
 * Redirect to Stripe Checkout
 */
export function redirectToStripeCheckout(url: string): void {
  if (typeof window === 'undefined') {
    throw new PaymentError(
      PaymentErrorCode.NOT_SUPPORTED,
      'Stripe redirect is only available in browser environment'
    );
  }

  logger.info('Redirecting to Stripe checkout...', { url: url.substring(0, 50) + '...' });
  window.location.href = url;
}

/**
 * Extract session ID from Stripe redirect URL
 * After successful payment, Stripe redirects back with session_id in query params
 */
export function extractSessionIdFromUrl(url?: string): string | null {
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  if (!targetUrl) {
    return null;
  }

  try {
    const urlObj = new URL(targetUrl);
    const sessionId = urlObj.searchParams.get('session_id');

    if (sessionId) {
      logger.info('Session ID extracted from URL', {
        sessionId: sessionId.substring(0, 20) + '...'
      });
    }

    return sessionId;
  } catch (error) {
    logger.error('Failed to extract session ID from URL', error);
    return null;
  }
}

/**
 * Check if URL contains Stripe session success
 */
export function isStripeSuccessUrl(url?: string): boolean {
  const sessionId = extractSessionIdFromUrl(url);
  return sessionId !== null;
}

/**
 * Check if URL contains Stripe cancellation
 */
export function isStripeCancelUrl(url?: string): boolean {
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  if (!targetUrl) {
    return false;
  }

  try {
    const urlObj = new URL(targetUrl);
    return urlObj.searchParams.has('canceled') || urlObj.searchParams.has('cancel');
  } catch (error) {
    return false;
  }
}

/**
 * Retrieve Stripe session details from backend
 */
export async function retrieveStripeSession(
  sessionId: string,
  adapter: EnvironmentAdapter
): Promise<any> {
  const apiBaseUrl = adapter.getConfig('apiBaseUrl');

  if (!apiBaseUrl) {
    throw new PaymentError(
      PaymentErrorCode.CONFIG_MISSING,
      'apiBaseUrl is required'
    );
  }

  try {
    logger.info('Retrieving Stripe session details...', {
      sessionId: sessionId.substring(0, 20) + '...'
    });

    const response = await adapter.fetch(
      `${apiBaseUrl}/api/payments/stripe/session/${sessionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new PaymentError(
        PaymentErrorCode.NETWORK_ERROR,
        `Failed to retrieve session: ${response.status}`
      );
    }

    const data = await response.json();
    logger.info('Stripe session retrieved successfully');

    return data;
  } catch (error) {
    if (error instanceof PaymentError) {
      throw error;
    }

    logger.error('Failed to retrieve Stripe session', error);
    throw new PaymentError(
      PaymentErrorCode.NETWORK_ERROR,
      'Failed to retrieve Stripe session details',
      error
    );
  }
}

/**
 * Validate Stripe session request
 */
export function validateSessionRequest(request: StripeSessionRequest): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!request.amount || request.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (request.currency && !/^[A-Z]{3}$/.test(request.currency)) {
    errors.push('Currency must be a 3-letter ISO code (e.g., USD, EUR)');
  }

  if (request.successUrl && !isValidUrl(request.successUrl)) {
    errors.push('Invalid success URL');
  }

  if (request.cancelUrl && !isValidUrl(request.cancelUrl)) {
    errors.push('Invalid cancel URL');
  }

  if (request.customerEmail && !isValidEmail(request.customerEmail)) {
    errors.push('Invalid customer email');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper: Validate URL
 */
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper: Validate Email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format amount for Stripe (convert to cents)
 */
export function formatAmountForStripe(amount: number, currency = 'USD'): number {
  // Zero-decimal currencies (e.g., JPY)
  const zeroDecimalCurrencies = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];

  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount);
  }

  // Default: convert to cents
  return Math.round(amount * 100);
}

/**
 * Parse amount from Stripe (convert from cents)
 */
export function parseAmountFromStripe(amount: number, currency = 'USD'): number {
  const zeroDecimalCurrencies = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];

  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return amount;
  }

  return amount / 100;
}
