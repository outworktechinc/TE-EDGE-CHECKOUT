/**
 * Universal Stripe Payment Service
 * Extracted and adapted from Ombee Mobile StripeService.ts
 */

import {
  StripeCheckoutSessionData,
  StripeCheckoutSession,
  StripePaymentResult
} from '../types/payment';

export class StripeService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    console.log('✅ StripeService initialized for direct checkout redirects');
    console.log('🔗 Using API base URL:', this.baseURL);
  }

  /**
   * Create Stripe Checkout Session via backend API
   */
  async createCheckoutSession(sessionData: StripeCheckoutSessionData): Promise<StripeCheckoutSession> {
    try {
      const url = `${this.baseURL}/stripe/createCheckoutSession`;
      console.log('🚀 Creating Stripe session at:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: sessionData.amount,
          currency: sessionData.currency || 'usd',
          origin: window.location.href,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create checkout session: ${response.status} - ${errorText}`);
      }

      const session = await response.json();
      console.log('✅ Stripe checkout session created:', session.id);

      return session;
    } catch (error) {
      console.error('❌ Failed to create Stripe checkout session:', error);
      throw error;
    }
  }

  /**
   * Redirect to Stripe Checkout using direct URL
   */
  async redirectToCheckout(sessionData: StripeCheckoutSessionData): Promise<void> {
    try {
      console.log('🚀 Creating Stripe checkout session...');
      const session = await this.createCheckoutSession(sessionData);

      if (!session.url) {
        throw new Error('No checkout URL received from API');
      }

      console.log('✅ Redirecting to Stripe checkout:', session.url);

      // Direct redirect to Stripe checkout URL
      window.location.href = session.url;
    } catch (error) {
      console.error('❌ Failed to redirect to Stripe checkout:', error);
      throw error;
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
      console.log('✅ Extracted Stripe session ID from URL:', sessionId);
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
    console.log('🧹 Cleared Stripe URL parameters');
  }

  /**
   * Retrieve checkout session details
   */
  async retrieveCheckoutSession(sessionId: string): Promise<any> {
    try {
      const url = `${this.baseURL}/stripe/retrieve-session/${sessionId}`;
      console.log('🔍 Retrieving Stripe session at:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to retrieve checkout session: ${response.status} - ${errorText}`);
      }

      const session = await response.json();
      console.log('✅ Retrieved Stripe session details:', session);

      return session;
    } catch (error) {
      console.error('❌ Failed to retrieve Stripe session:', error);
      throw error;
    }
  }

  /**
   * Process Stripe payment with session ID
   */
  async processStripePayment(sessionId: string): Promise<StripePaymentResult> {
    try {
      const session = await this.retrieveCheckoutSession(sessionId);

      if (session.payment_status === 'paid') {
        console.log('✅ Stripe payment completed successfully');
        return {
          success: true,
          sessionId: sessionId,
          details: session
        };
      } else {
        throw new Error(`Payment not completed. Status: ${session.payment_status}`);
      }
    } catch (error) {
      console.error('❌ Stripe payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stripe payment processing failed'
      };
    }
  }
}