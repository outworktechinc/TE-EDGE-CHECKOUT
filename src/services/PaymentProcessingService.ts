/**
 * Universal Payment Processing Service
 * Extracted and adapted from Ombee Mobile PaymentProcessingService.ts
 */

import {
  PaymentMethodNonce,
  BraintreeInstance,
  BraintreeError,
  AuthorizeNetCardData,
  AuthorizeNetAuthData,
  AuthorizeNetResponse,
  PaymentProcessingResult
} from '../types/payment';

export class PaymentProcessingService {
  private braintreeInstance: BraintreeInstance | null = null;
  private braintreeClientToken: string | null = null;
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Initialize Braintree Drop-in UI
   */
  async initializeBraintree(container: string): Promise<void> {
    try {
      // Load Braintree script if not already loaded
      if (!window.braintree) {
        await this.loadBraintreeScript();
      }

      // Get client token from backend
      const clientToken = await this.getBraintreeClientToken();
      this.braintreeClientToken = clientToken;

      // Check if we're using mock token (development mode)
      if (clientToken.includes('mock')) {
        console.warn('⚠️ Using mock Braintree token for development. Payment processing will be simulated.');

        // Simulate successful initialization for development
        this.braintreeInstance = {
          requestPaymentMethod: () => Promise.resolve({
            nonce: 'mock_braintree_nonce_for_development',
            type: 'CreditCard',
            description: 'Mock payment method for development'
          } as PaymentMethodNonce),
          clearSelectedPaymentMethod: () => {},
          isPaymentMethodRequestable: () => true
        };

        console.log('✅ Braintree Mock initialized successfully');
        return;
      }

      return new Promise((resolve, reject) => {
        window.braintree.dropin.create({
          authorization: clientToken,
          container: container,
          paypal: {
            flow: 'checkout',
            amount: '10.00',
            currency: 'USD'
          }
        }, (error, instance) => {
          if (error) {
            console.error('Braintree initialization error:', error);
            reject(error);
            return;
          }

          this.braintreeInstance = instance;
          console.log('✅ Braintree Drop-in initialized successfully');
          resolve();
        });
      });
    } catch (error) {
      console.error('Failed to initialize Braintree:', error);
      throw error;
    }
  }

  /**
   * Process payment with Braintree
   */
  async processBraintreePayment(): Promise<PaymentProcessingResult> {
    if (!this.braintreeInstance) {
      return {
        success: false,
        error: 'Braintree not initialized'
      };
    }

    try {
      if (!this.braintreeInstance.isPaymentMethodRequestable()) {
        return {
          success: false,
          error: 'No payment method available'
        };
      }

      const payload = await this.braintreeInstance.requestPaymentMethod();

      console.log('✅ Braintree payment method created:', payload);

      return {
        success: true,
        paymentMethodId: payload.nonce,
        details: payload
      };
    } catch (error) {
      console.error('Braintree payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  /**
   * Initialize Authorize.Net Accept.js
   */
  async initializeAuthorizeNet(): Promise<void> {
    try {
      if (!window.Accept) {
        await this.loadAuthorizeNetScript();
      }
      console.log('✅ Authorize.Net Accept.js loaded successfully');
    } catch (error) {
      console.error('Failed to initialize Authorize.Net:', error);
      throw error;
    }
  }

  /**
   * Process payment with Authorize.Net
   */
  async processAuthorizeNetPayment(cardData: AuthorizeNetCardData): Promise<PaymentProcessingResult> {
    try {
      const authData = await this.getAuthorizeNetCredentials();

      if (authData.clientKey.includes('mock')) {
        console.warn('⚠️ Using mock Authorize.Net credentials for development. Payment processing will be simulated.');

        return {
          success: true,
          paymentMethodId: 'mock_authorize_net_token_for_development',
          details: {
            dataDescriptor: 'COMMON.ACCEPT.INAPP.PAYMENT',
            dataValue: 'mock_authorize_net_token_for_development'
          }
        };
      }

      if (!window.Accept) {
        return {
          success: false,
          error: 'Authorize.Net not initialized'
        };
      }

      return new Promise((resolve) => {
        window.Accept.dispatchData({
          authData,
          cardData
        }, (response) => {
          if (response.messages.resultCode === "Error") {
            console.error('Authorize.Net error:', response.messages.message);
            resolve({
              success: false,
              error: response.messages.message[0]?.text || 'Payment processing failed'
            });
          } else {
            console.log('✅ Authorize.Net payment token created:', response.opaqueData);
            resolve({
              success: true,
              paymentMethodId: response.opaqueData?.dataValue || '',
              details: response.opaqueData
            });
          }
        });
      });
    } catch (error) {
      console.error('Authorize.Net payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  /**
   * Load Braintree script dynamically
   */
  private loadBraintreeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="braintreegateway.com"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.braintreegateway.com/web/dropin/1.39.0/js/dropin.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Braintree script'));
      document.head.appendChild(script);
    });
  }

  /**
   * Load Authorize.Net script dynamically
   */
  private loadAuthorizeNetScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="authorize.net"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.authorize.net/v3/Accept.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Authorize.Net script'));
      document.head.appendChild(script);
    });
  }

  /**
   * Get Braintree client token from backend
   */
  private async getBraintreeClientToken(): Promise<string> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/braintree/token`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Backend endpoint not available');
      }

      const data = await response.json();
      return data.clientToken;
    } catch (error) {
      console.warn('⚠️ Braintree backend endpoint not available, using mock for development:', error);
      return 'sandbox_mock_client_token_for_development';
    }
  }

  /**
   * Get Authorize.Net credentials
   */
  private async getAuthorizeNetCredentials(): Promise<AuthorizeNetAuthData> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/authorize-net/credentials`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Backend endpoint not available');
      }

      const data = await response.json();
      return {
        clientKey: data.clientKey,
        apiLoginID: data.apiLoginID
      };
    } catch (error) {
      console.warn('⚠️ Authorize.Net backend endpoint not available, using mock for development:', error);
      return {
        clientKey: 'mock_client_key_for_development',
        apiLoginID: 'mock_api_login_id_for_development'
      };
    }
  }

  /**
   * Clean up payment instances
   */
  cleanup(): void {
    if (this.braintreeInstance) {
      this.braintreeInstance = null;
    }
    this.braintreeClientToken = null;
  }
}