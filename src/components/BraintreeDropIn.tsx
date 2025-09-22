/**
 * Universal Braintree Drop-in Component
 * Extracted and adapted from Ombee Mobile BraintreeDropIn.tsx
 */

import React, { useEffect, useRef, useState } from 'react';
import { PaymentProcessingService } from '../services/PaymentProcessingService';
import { PaymentProcessingResult } from '../types/payment';

interface BraintreeDropInProps {
  onPaymentMethodCreated: (result: PaymentProcessingResult) => void;
  onError: (error: string) => void;
  amount?: number;
  isProcessing?: boolean;
  apiBaseUrl: string;
}

export const BraintreeDropIn: React.FC<BraintreeDropInProps> = ({
  onPaymentMethodCreated,
  onError,
  amount = 0,
  isProcessing = false,
  apiBaseUrl
}) => {
  const dropinContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [paymentService] = useState(() => new PaymentProcessingService(apiBaseUrl));

  // Initialize Braintree when component mounts
  useEffect(() => {
    const initializeBraintree = async () => {
      if (!dropinContainerRef.current) return;

      try {
        setIsLoading(true);
        setInitError(null);

        await paymentService.initializeBraintree('#braintree-dropin-container');
        setIsInitialized(true);
        console.log('✅ Braintree Drop-in UI initialized');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize Braintree';
        console.error('❌ Braintree initialization failed:', errorMessage);
        setInitError(errorMessage);
        onError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initializeBraintree();

    // Cleanup on unmount
    return () => {
      paymentService.cleanup();
    };
  }, [onError, paymentService]);

  // Handle payment processing
  const handlePayment = async () => {
    if (!isInitialized) {
      onError('Braintree not initialized');
      return;
    }

    try {
      const result = await paymentService.processBraintreePayment();
      onPaymentMethodCreated(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      onError(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <p className="text-sm text-gray-600">Loading payment options...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-red-800 font-medium text-sm">Payment System Error</h4>
            <p className="text-red-600 text-xs mt-1">{initError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Braintree Drop-in Container */}
      <div
        id="braintree-dropin-container"
        ref={dropinContainerRef}
        className="min-h-[200px] border border-gray-200 rounded-lg p-4 bg-white"
      >
        {/* Mock UI for development when Braintree scripts aren't loaded */}
        {isInitialized && (
          <div className="space-y-4">
            <div className="text-center text-gray-600">
              <div className="inline-flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-yellow-800">Development Mode</span>
              </div>
              <p className="text-sm mt-2">Braintree Drop-in would appear here in production</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                    <span className="text-sm text-gray-600">•••• 4242</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-8 bg-blue-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">PayPal</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Mock payment methods for testing</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={!isInitialized || isProcessing}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isInitialized && !isProcessing
            ? 'bg-black text-white hover:bg-gray-800'
            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </button>

      {/* Payment Info */}
      <div className="text-xs text-gray-500 text-center">
        <p>Secure payment powered by Braintree</p>
        <div className="flex justify-center gap-4 mt-2">
          <span>💳 Credit Cards</span>
          <span>🏦 PayPal</span>
          <span>🔒 Secure</span>
        </div>
        {isInitialized && (
          <p className="text-yellow-600 mt-1">⚠️ Development mode - payments will be simulated</p>
        )}
      </div>
    </div>
  );
};