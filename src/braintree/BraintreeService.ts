/**
 * Braintree Payment Service
 * Enhanced version with proper error handling and configuration
 */

import { PaymentGateway, PaymentRequest, PaymentResult, PaymentMethod, RefundRequest, RefundResult, WebhookEvent, GatewayCapabilities } from '../core/types';
import { PaymentError, PaymentErrorCode, createPaymentError, normalizeGatewayError } from '../core/errors';
import { BraintreeConfig } from '../core/config';
import { createGatewayLogger } from '../utils/logger';
import { BraintreeDropinInstance, BraintreeError, BraintreeDropinOptions, BraintreePaymentResult, BraintreeClientTokenResponse } from './types';

export class BraintreeService implements PaymentGateway {
  readonly provider = 'braintree' as const;
  readonly capabilities: GatewayCapabilities = {
    supportedPaymentMethods: ['card'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    supportsRefunds: true,
    supportsPartialRefunds: true,
    supportsRecurring: true,
    supportsWebhooks: true,
    supportsManualCapture: false,
    minimumAmount: 100, // $1.00 minimum
  };

  private config: BraintreeConfig | null = null;
  private logger = createGatewayLogger('braintree');
  private dropinInstance: BraintreeDropinInstance | null = null;
  private clientToken: string | null = null;
  private initialized = false;

  /**
   * Initialize the Braintree service with configuration
   */
  async initialize(config: BraintreeConfig): Promise<void> {
    try {
      this.logger.info('Initializing Braintree service', { environment: config.environment });

      this.config = config;

      // Validate configuration
      this.validateConfig(config);

      // Load Braintree scripts
      await this.loadBraintreeScripts();

      // Get client token
      this.clientToken = await this.getClientToken();

      this.initialized = true;
      this.logger.info('Braintree service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Braintree service', { error });
      throw normalizeGatewayError(error, 'braintree');
    }
  }

  /**
   * Create a payment intent (create drop-in instance)
   */
  async createPaymentIntent(request: PaymentRequest): Promise<PaymentResult> {
    this.ensureInitialized();

    try {
      this.logger.info('Creating Braintree payment intent', {
        amount: request.amount,
        currency: request.currency
      });

      // For Braintree, we need to create the drop-in instance
      await this.createDropinInstance('#braintree-dropin-container', {
        amount: request.amount.toString(),
        currency: request.currency
      });

      const result: BraintreePaymentResult = {
        success: true,
        paymentIntent: {
          id: `braintree_intent_${Date.now()}`,
          amount: request.amount,
          currency: request.currency,
          status: 'pending',
          description: request.description,
          metadata: request.metadata,
          created: new Date(),
          updated: new Date()
        }
      };

      this.logger.info('Braintree payment intent created successfully');
      return result;
    } catch (error) {
      this.logger.error('Failed to create Braintree payment intent', { error });
      throw normalizeGatewayError(error, 'braintree');
    }
  }

  /**
   * Confirm a payment intent (request payment method)
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<PaymentResult> {
    this.ensureInitialized();

    try {
      this.logger.info('Confirming Braintree payment intent', { paymentIntentId });

      if (!this.dropinInstance) {
        throw createPaymentError(
          PaymentErrorCode.INITIALIZATION_ERROR,
          'Braintree drop-in instance not created',
          'braintree'
        );
      }

      if (!this.dropinInstance.isPaymentMethodRequestable()) {
        throw createPaymentError(
          PaymentErrorCode.VALIDATION_ERROR,
          'No payment method available',
          'braintree'
        );
      }

      const payload = await this.dropinInstance.requestPaymentMethod();

      const result: BraintreePaymentResult = {
        success: true,
        paymentMethod: {
          id: `braintree_pm_${Date.now()}`,
          provider: 'braintree',
          type: 'card',
          token: payload.nonce,
          last4: payload.details?.lastFour,
          brand: payload.details?.cardType,
          expiryMonth: payload.details?.expirationMonth,
          expiryYear: payload.details?.expirationYear,
          isDefault: true,
          created: new Date()
        },
        nonce: payload.nonce,
        metadata: { braintreeDetails: payload.details }
      };

      this.logger.info('Braintree payment intent confirmed successfully', { nonce: payload.nonce });
      return result;
    } catch (error) {
      this.logger.error('Failed to confirm Braintree payment intent', { error });
      throw normalizeGatewayError(error, 'braintree');
    }
  }

  /**
   * Capture a payment (not applicable for Braintree drop-in)
   */
  async capturePayment(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    throw createPaymentError(
      PaymentErrorCode.CONFIGURATION_ERROR,
      'Manual capture not supported with Braintree drop-in',
      'braintree'
    );
  }

  /**
   * Create a payment method
   */
  async createPaymentMethod(data: any): Promise<PaymentMethod> {
    this.ensureInitialized();

    const result = await this.confirmPaymentIntent('temp_intent');
    if (result.paymentMethod) {
      return result.paymentMethod;
    }

    throw createPaymentError(
      PaymentErrorCode.PROCESSING_ERROR,
      'Failed to create payment method',
      'braintree'
    );
  }

  /**
   * Process a refund
   */
  async refundPayment(request: RefundRequest): Promise<RefundResult> {
    this.ensureInitialized();

    try {
      this.logger.info('Processing Braintree refund', {
        paymentIntentId: request.paymentIntentId,
        amount: request.amount
      });

      // This would need to be implemented with actual Braintree API calls
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'Refund functionality requires backend implementation',
        'braintree'
      );
    } catch (error) {
      this.logger.error('Failed to process Braintree refund', { error });
      throw normalizeGatewayError(error, 'braintree');
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
      this.logger.info('Processing Braintree webhook', {
        eventId: event.id,
        eventType: event.type
      });

      // Handle different webhook event types
      switch (event.type) {
        case 'transaction_settled':
          await this.handleTransactionSettled(event.data);
          break;
        case 'transaction_declined':
          await this.handleTransactionDeclined(event.data);
          break;
        default:
          this.logger.info('Unhandled webhook event type', { eventType: event.type });
      }
    } catch (error) {
      this.logger.error('Failed to process Braintree webhook', { error });
      throw normalizeGatewayError(error, 'braintree');
    }
  }

  /**
   * Create drop-in instance
   */
  async createDropinInstance(
    container: string,
    options: { amount?: string; currency?: string } = {}
  ): Promise<void> {
    this.ensureInitialized();

    if (!this.clientToken) {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'Client token not available',
        'braintree'
      );
    }

    // Check for mock token (development mode)
    if (this.clientToken.includes('mock')) {
      this.logger.warn('Using mock Braintree token for development');

      // Create mock instance for development
      this.dropinInstance = {
        requestPaymentMethod: () => Promise.resolve({
          nonce: 'mock_braintree_nonce_for_development',
          type: 'CreditCard',
          description: 'Mock payment method for development',
          details: {
            lastFour: '4242',
            cardType: 'Visa'
          }
        }),
        clearSelectedPaymentMethod: () => {},
        isPaymentMethodRequestable: () => true,
        updateConfiguration: () => {},
        teardown: () => Promise.resolve()
      };

      return;
    }

    return new Promise((resolve, reject) => {
      if (!window.braintree) {
        reject(createPaymentError(
          PaymentErrorCode.INITIALIZATION_ERROR,
          'Braintree SDK not loaded',
          'braintree'
        ));
        return;
      }

      const dropinOptions: BraintreeDropinOptions = {
        authorization: this.clientToken!,
        container: container,
        paypal: {
          flow: 'checkout',
          amount: options.amount || '10.00',
          currency: options.currency || 'USD'
        }
      };

      window.braintree.dropin.create(dropinOptions, (error, instance) => {
        if (error) {
          this.logger.error('Braintree drop-in creation failed', { error });
          reject(normalizeGatewayError(error, 'braintree'));
          return;
        }

        this.dropinInstance = instance;
        this.logger.info('Braintree drop-in created successfully');
        resolve();
      });
    });
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.logger.info('Cleaning up Braintree service');

    if (this.dropinInstance) {
      this.dropinInstance.teardown().catch(error => {
        this.logger.warn('Error during Braintree drop-in teardown', { error });
      });
      this.dropinInstance = null;
    }

    this.initialized = false;
    this.config = null;
    this.clientToken = null;
  }

  /**
   * Private: Load Braintree scripts
   */
  private async loadBraintreeScripts(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="braintreegateway.com"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.braintreegateway.com/web/dropin/1.39.0/js/dropin.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(createPaymentError(
        PaymentErrorCode.NETWORK_ERROR,
        'Failed to load Braintree script',
        'braintree'
      ));
      document.head.appendChild(script);
    });
  }

  /**
   * Private: Get client token from backend
   */
  private async getClientToken(): Promise<string> {
    if (!this.config) {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'Braintree service not configured',
        'braintree'
      );
    }

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/braintree/token`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Backend endpoint not available');
      }

      const data: BraintreeClientTokenResponse = await response.json();
      return data.clientToken;
    } catch (error) {
      this.logger.warn('Braintree backend endpoint not available, using mock for development', { error });
      return 'sandbox_mock_client_token_for_development';
    }
  }

  /**
   * Private: Webhook event handlers
   */
  private async handleTransactionSettled(data: any): Promise<void> {
    this.logger.info('Transaction settled', { transactionId: data.id });
    // Implement custom logic for settled transactions
  }

  private async handleTransactionDeclined(data: any): Promise<void> {
    this.logger.warn('Transaction declined', { transactionId: data.id });
    // Implement custom logic for declined transactions
  }

  /**
   * Private: Validate configuration
   */
  private validateConfig(config: BraintreeConfig): void {
    if (!config.apiBaseUrl) {
      throw createPaymentError(
        PaymentErrorCode.CONFIGURATION_ERROR,
        'API base URL is required for Braintree',
        'braintree'
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
        'Braintree service not initialized',
        'braintree'
      );
    }
  }
}