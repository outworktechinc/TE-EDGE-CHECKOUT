/**
 * Stripe Payment Service
 * Enhanced version with proper error handling and configuration
 */

import { PaymentGateway, PaymentRequest, PaymentResult, PaymentMethod, RefundRequest, RefundResult, WebhookEvent, GatewayCapabilities } from '../core/types';
import { PaymentError, PaymentErrorCode, createPaymentError, normalizeGatewayError } from '../core/errors';
import { StripeConfig } from '../core/config';
import { createGatewayLogger } from '../utils/logger';
import { StripeCheckoutSessionData, StripeCheckoutSession, StripePaymentResult } from './types';

export class StripeService implements PaymentGateway {
  readonly provider = 'stripe' as const;
  readonly capabilities: GatewayCapabilities = {
    supportedPaymentMethods: ['card'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    supportsRefunds: true,
    supportsPartialRefunds: true,
    supportsRecurring: true,
    supportsWebhooks: true,
    supportsManualCapture: true,
    minimumAmount: 50, // $0.50 minimum
    maximumAmount: 99999999 // $999,999.99 maximum
  };

  private config: StripeConfig | null = null;
  private logger = createGatewayLogger('stripe');
  private initialized = false;

  /**
   * Initialize the Stripe service with configuration
   */
  async initialize(config: StripeConfig): Promise<void> {
    try {
      this.logger.info('Initializing Stripe service', { environment: config.environment });

      this.config = config;

      // Validate configuration
      this.validateConfig(config);

      this.initialized = true;
      this.logger.info('Stripe service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Stripe service', { error });
      throw normalizeGatewayError(error, 'stripe');
    }
  }

  /**
   * Create a payment intent (via checkout session)
   */
  async createPaymentIntent(request: PaymentRequest): Promise<PaymentResult> {
    this.ensureInitialized();

    try {
      this.logger.info('Creating Stripe payment intent', {
        amount: request.amount,
        currency: request.currency
      });

      const sessionData: StripeCheckoutSessionData = {
        amount: request.amount,
        currency: request.currency,
        customerEmail: request.customer?.email,
        metadata: request.metadata
      };

      const session = await this.createCheckoutSession(sessionData);

      const result: StripePaymentResult = {
        success: true,
        paymentIntent: {
          id: session.id,
          amount: request.amount,
          currency: request.currency,
          status: 'pending',
          description: request.description,
          metadata: request.metadata,
          created: new Date(),
          updated: new Date()
        },
        sessionId: session.id,
        checkoutUrl: session.url,
        metadata: { sessionUrl: session.url }
      };

      this.logger.info('Stripe payment intent created successfully', { sessionId: session.id });
      return result;
    } catch (error) {
      this.logger.error('Failed to create Stripe payment intent', { error });
      throw normalizeGatewayError(error, 'stripe');
    }
  }

  /**
   * Confirm a payment intent (handled by Stripe Checkout)
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<PaymentResult> {
    this.ensureInitialized();

    try {
      this.logger.info('Confirming Stripe payment intent', { paymentIntentId });

      const session = await this.retrieveCheckoutSession(paymentIntentId);

      const result: StripePaymentResult = {
        success: session.payment_status === 'paid',
        paymentIntent: {
          id: session.id,
          amount: session.amount_total || 0,
          currency: session.currency || 'USD',
          status: session.payment_status === 'paid' ? 'succeeded' : 'pending',
          created: new Date(),
          updated: new Date()
        },
        sessionId: session.id
      };

      this.logger.info('Stripe payment intent confirmed', {
        sessionId: session.id,
        status: session.payment_status
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to confirm Stripe payment intent', { error });
      throw normalizeGatewayError(error, 'stripe');
    }
  }

  /**
   * Capture a payment (not applicable for Stripe Checkout)
   */
  async capturePayment(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    throw createPaymentError(
      PaymentErrorCode.CONFIGURATION_ERROR,
      'Manual capture not supported with Stripe Checkout',
      'stripe'
    );
  }

  /**
   * Create a payment method (handled by Stripe Checkout)
   */
  async createPaymentMethod(data: any): Promise<PaymentMethod> {
    throw createPaymentError(
      PaymentErrorCode.CONFIGURATION_ERROR,
      'Payment method creation is handled by Stripe Checkout',
      'stripe'
    );
  }

  /**
   * Process a refund
   */
  async refundPayment(request: RefundRequest): Promise<RefundResult> {
    this.ensureInitialized();

    try {
      this.logger.info('Processing Stripe refund', {
        paymentIntentId: request.paymentIntentId,
        amount: request.amount
      });

      // This would need to be implemented with actual Stripe API calls
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'Refund functionality requires backend implementation',
        'stripe'
      );
    } catch (error) {
      this.logger.error('Failed to process Stripe refund', { error });
      throw normalizeGatewayError(error, 'stripe');
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentIntentId: string): Promise<PaymentResult> {
    return this.confirmPaymentIntent(paymentIntentId);
  }

  /**
   * Process webhook events
   */
  async processWebhook(event: WebhookEvent): Promise<void> {
    this.ensureInitialized();

    try {
      this.logger.info('Processing Stripe webhook', {
        eventId: event.id,
        eventType: event.type
      });

      // Handle different webhook event types
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data);
          break;
        default:
          this.logger.info('Unhandled webhook event type', { eventType: event.type });
      }
    } catch (error) {
      this.logger.error('Failed to process Stripe webhook', { error });
      throw normalizeGatewayError(error, 'stripe');
    }
  }

  /**
   * Redirect to Stripe Checkout
   */
  async redirectToCheckout(sessionData: StripeCheckoutSessionData): Promise<void> {
    this.ensureInitialized();

    try {
      this.logger.info('Redirecting to Stripe checkout');

      const session = await this.createCheckoutSession(sessionData);

      if (!session.url) {
        throw createPaymentError(
          PaymentErrorCode.PROCESSING_ERROR,
          'No checkout URL received from Stripe',
          'stripe'
        );
      }

      this.logger.info('Redirecting to Stripe checkout URL', { sessionId: session.id });

      // Direct redirect to Stripe checkout URL
      if (typeof window !== 'undefined') {
        window.location.href = session.url;
      }
    } catch (error) {
      this.logger.error('Failed to redirect to Stripe checkout', { error });
      throw normalizeGatewayError(error, 'stripe');
    }
  }

  /**
   * Extract session ID from URL parameters
   */
  extractSessionIdFromUrl(): string | null {
    if (typeof window === 'undefined') return null;

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      this.logger.debug('Extracted Stripe session ID from URL', { sessionId });
    }

    return sessionId;
  }

  /**
   * Clear URL parameters after processing
   */
  clearUrlParameters(): void {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    url.searchParams.delete('session_id');
    url.searchParams.delete('canceled');

    // Update URL without page reload
    window.history.replaceState({}, document.title, url.toString());
    this.logger.debug('Cleared Stripe URL parameters');
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.logger.info('Cleaning up Stripe service');
    this.initialized = false;
    this.config = null;
  }

  /**
   * Private: Create checkout session
   */
  private async createCheckoutSession(sessionData: StripeCheckoutSessionData): Promise<StripeCheckoutSession> {
    if (!this.config) {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'Stripe service not configured',
        'stripe'
      );
    }

    const url = `${this.config.apiBaseUrl}/stripe/createCheckoutSession`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: sessionData.amount,
        currency: sessionData.currency || 'USD',
        customer_email: sessionData.customerEmail,
        metadata: sessionData.metadata,
        origin: typeof window !== 'undefined' ? window.location.href : undefined
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw createPaymentError(
        PaymentErrorCode.NETWORK_ERROR,
        `Failed to create checkout session: ${response.status} - ${errorText}`,
        'stripe'
      );
    }

    const session = await response.json();
    return session;
  }

  /**
   * Private: Retrieve checkout session
   */
  private async retrieveCheckoutSession(sessionId: string): Promise<StripeCheckoutSession> {
    if (!this.config) {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'Stripe service not configured',
        'stripe'
      );
    }

    const url = `${this.config.apiBaseUrl}/stripe/retrieve-session/${sessionId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw createPaymentError(
        PaymentErrorCode.NETWORK_ERROR,
        `Failed to retrieve checkout session: ${response.status} - ${errorText}`,
        'stripe'
      );
    }

    const session = await response.json();
    return session;
  }

  /**
   * Private: Webhook event handlers
   */
  private async handleCheckoutSessionCompleted(data: any): Promise<void> {
    this.logger.info('Checkout session completed', { sessionId: data.id });
    // Implement custom logic for completed sessions
  }

  private async handlePaymentIntentSucceeded(data: any): Promise<void> {
    this.logger.info('Payment intent succeeded', { paymentIntentId: data.id });
    // Implement custom logic for successful payments
  }

  private async handlePaymentIntentFailed(data: any): Promise<void> {
    this.logger.warn('Payment intent failed', { paymentIntentId: data.id });
    // Implement custom logic for failed payments
  }

  /**
   * Private: Validate configuration
   */
  private validateConfig(config: StripeConfig): void {
    if (!config.apiBaseUrl) {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'API base URL is required for Stripe',
        'stripe'
      );
    }

    if (config.environment === 'production' && config.publishableKey?.includes('pk_test')) {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'Test publishable key cannot be used in production',
        'stripe'
      );
    }
  }

  /**
   * Private: Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw createPaymentError(
        PaymentErrorCode.INITIALIZATION_ERROR,
        'Stripe service not initialized',
        'stripe'
      );
    }
  }
}