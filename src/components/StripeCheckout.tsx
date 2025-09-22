/**
 * Universal Stripe Checkout Component
 * Extracted and adapted from Ombee Mobile StripeCheckout.tsx
 */

import React, { useState } from 'react';
import { StripeService } from '../services/StripeService';
import { StripePaymentResult } from '../types/payment';

interface StripeCheckoutProps {
  onPaymentSuccess: (result: StripePaymentResult) => void;
  onPaymentError: (error: string) => void;
  amount: number;
  isProcessing?: boolean;
  apiBaseUrl: string;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  onPaymentSuccess,
  onPaymentError,
  amount,
  isProcessing = false,
  apiBaseUrl
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const stripeService = new StripeService(apiBaseUrl);

  const handleStripeCheckout = async () => {
    try {
      setIsRedirecting(true);

      const sessionData = {
        amount: amount,
        currency: 'usd',
      };

      console.log('🚀 Initiating Stripe checkout redirect...');

      // Redirect to Stripe Checkout
      await stripeService.redirectToCheckout(sessionData);

    } catch (error) {
      console.error('❌ Stripe checkout redirect failed:', error);
      setIsRedirecting(false);
      onPaymentError(error instanceof Error ? error.message : 'Failed to redirect to Stripe');
    }
  };

  return (
    <div className="space-y-4">
      {/* Stripe Checkout Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <div>
            <h4 className="text-blue-800 font-medium text-sm">Stripe Checkout</h4>
            <p className="text-blue-600 text-xs mt-1">You'll be redirected to secure Stripe payment page</p>
          </div>
        </div>
      </div>

      {/* Payment Amount Display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Payment Amount:</span>
          <span className="text-lg font-bold text-gray-900">${amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleStripeCheckout}
        disabled={isRedirecting || isProcessing}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          !isRedirecting && !isProcessing
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
        }`}
      >
        {isRedirecting || isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isRedirecting ? 'Redirecting to Stripe...' : 'Processing...'}
          </div>
        ) : (
          `Continue to Stripe Checkout`
        )}
      </button>

      {/* Payment Security Info */}
      <div className="text-xs text-gray-500 text-center">
        <p>Secure payment powered by Stripe</p>
        <div className="flex justify-center gap-4 mt-2">
          <span>💳 All Cards</span>
          <span>🔒 SSL Secure</span>
          <span>🛡️ PCI Compliant</span>
        </div>
      </div>

      {/* Stripe Test Mode Notice */}
      {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('pk_test') && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-blue-800">Test Mode</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">Using Stripe test environment - use test card 4242 4242 4242 4242</p>
        </div>
      )}
    </div>
  );
};