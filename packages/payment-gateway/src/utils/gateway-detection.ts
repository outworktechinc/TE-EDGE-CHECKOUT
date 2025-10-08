/**
 * Gateway Detection Utilities
 * Detects active payment gateway from backend API
 */

import {
  GatewayDetectionResponse,
  PaymentConfiguration,
  EnvironmentAdapter,
  PaymentError,
  PaymentErrorCode
} from '../types';
import { logger } from './logger';

/**
 * Detect active gateway from backend API
 * Calls /api/integration/getDefaultSubscriptionType
 */
export async function detectActiveGateway(
  adapter: EnvironmentAdapter
): Promise<PaymentConfiguration> {
  const apiBaseUrl = adapter.getConfig('apiBaseUrl');

  if (!apiBaseUrl) {
    throw new PaymentError(
      PaymentErrorCode.CONFIG_MISSING,
      'apiBaseUrl is required in configuration'
    );
  }

  try {
    logger.info('Detecting active payment gateway...', { apiBaseUrl });

    const response = await adapter.fetch(
      `${apiBaseUrl}/api/integration/getDefaultSubscriptionType`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new PaymentError(
        PaymentErrorCode.DETECTION_FAILED,
        `Gateway detection failed: ${response.status} ${response.statusText}`
      );
    }

    const data: GatewayDetectionResponse = await response.json();

    if (!data.Status) {
      throw new PaymentError(
        PaymentErrorCode.DETECTION_FAILED,
        data.message || 'Gateway detection failed'
      );
    }

    logger.info('Gateway detected successfully', {
      gateway: data.data.gatewayName,
      method: data.data.paymentThrough,
      redirect: data.data.redirectUrl.isAvailable
    });

    // Determine scenario and configuration
    const config = determinePaymentScenario(data);

    return config;
  } catch (error) {
    if (error instanceof PaymentError) {
      throw error;
    }

    logger.error('Failed to detect active gateway', error);
    throw new PaymentError(
      PaymentErrorCode.DETECTION_FAILED,
      'Failed to detect active gateway',
      error
    );
  }
}

/**
 * Determine payment scenario based on API response
 */
export function determinePaymentScenario(
  response: GatewayDetectionResponse
): PaymentConfiguration {
  const { gatewayName, paymentThrough, redirectUrl } = response.data;

  // Scenario A: Stripe with Stripe checkout (session-based), no redirect
  if (
    gatewayName === 'Stripe' &&
    paymentThrough === 'Stripe' &&
    !redirectUrl.isAvailable
  ) {
    logger.debug('Scenario: Stripe session-based checkout');
    return {
      gatewayName: 'Stripe',
      paymentMethod: 'Stripe',
      requiresRedirect: false,
      scenario: 'stripe-session',
      tokenType: 'sessionId'
    };
  }

  // Scenario B: Stripe with Stripe checkout (hosted page), with redirect
  if (
    gatewayName === 'Stripe' &&
    paymentThrough === 'Stripe' &&
    redirectUrl.isAvailable
  ) {
    logger.debug('Scenario: Stripe redirect checkout', { url: redirectUrl.url });
    return {
      gatewayName: 'Stripe',
      paymentMethod: 'Stripe',
      requiresRedirect: true,
      redirectUrl: redirectUrl.url,
      scenario: 'stripe-redirect',
      tokenType: 'sessionId'
    };
  }

  // Scenario C: Braintree with Edge Checkout
  if (
    gatewayName === 'Braintree' &&
    paymentThrough === 'Edge Checkout'
  ) {
    logger.debug('Scenario: Braintree Edge Checkout');
    return {
      gatewayName: 'Braintree',
      paymentMethod: 'Edge Checkout',
      requiresRedirect: false,
      scenario: 'braintree-edge',
      tokenType: 'nonce'
    };
  }

  // Scenario D: Authorize.Net with Edge Checkout
  if (
    gatewayName === 'Authorize.Net' &&
    paymentThrough === 'Edge Checkout'
  ) {
    logger.debug('Scenario: Authorize.Net Edge Checkout');
    return {
      gatewayName: 'Authorize.Net',
      paymentMethod: 'Edge Checkout',
      requiresRedirect: false,
      scenario: 'authorizenet-edge',
      tokenType: 'rawCard'
    };
  }

  // Unsupported scenario
  throw new PaymentError(
    PaymentErrorCode.NOT_SUPPORTED,
    `Unsupported payment configuration: ${gatewayName} with ${paymentThrough}`
  );
}

/**
 * Check if Stripe redirect is required
 */
export function requiresStripeRedirect(config: PaymentConfiguration): boolean {
  return config.scenario === 'stripe-redirect';
}

/**
 * Check if Edge Checkout is required
 */
export function requiresEdgeCheckout(config: PaymentConfiguration): boolean {
  return config.scenario === 'braintree-edge' || config.scenario === 'authorizenet-edge';
}

/**
 * Get expected token type for configuration
 */
export function getExpectedTokenType(config: PaymentConfiguration): 'sessionId' | 'nonce' | 'rawCard' {
  return config.tokenType;
}

/**
 * Validate payment configuration
 */
export function validatePaymentConfiguration(config: PaymentConfiguration): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.gatewayName) {
    errors.push('Gateway name is missing');
  }

  if (!config.paymentMethod) {
    errors.push('Payment method is missing');
  }

  if (!config.scenario) {
    errors.push('Payment scenario is missing');
  }

  if (!config.tokenType) {
    errors.push('Token type is missing');
  }

  if (config.requiresRedirect && !config.redirectUrl) {
    errors.push('Redirect URL is required but missing');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format configuration for display/logging
 */
export function formatConfigurationSummary(config: PaymentConfiguration): string {
  const lines = [
    `Gateway: ${config.gatewayName}`,
    `Payment Method: ${config.paymentMethod}`,
    `Scenario: ${config.scenario}`,
    `Token Type: ${config.tokenType}`,
    `Requires Redirect: ${config.requiresRedirect ? 'Yes' : 'No'}`
  ];

  if (config.redirectUrl) {
    lines.push(`Redirect URL: ${config.redirectUrl}`);
  }

  return lines.join('\n');
}
