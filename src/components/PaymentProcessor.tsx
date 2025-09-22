/**
 * Universal Payment Processor Component
 * Extracted and adapted from Ombee Mobile PaymentProcessor.tsx
 */

import React, { useState } from 'react';
import { PaymentGatewayConfig, PaymentProcessingResult, StripePaymentResult } from '../types/payment';
import { BraintreeDropIn } from './BraintreeDropIn';
import { AuthorizeNetForm } from './AuthorizeNetForm';
import { StripeCheckout } from './StripeCheckout';

interface PaymentProcessorProps {
  onPaymentSuccess: (paymentMethodId: string, details?: any) => void;
  onPaymentError: (error: string) => void;
  amount: number;
  isProcessing?: boolean;
  gatewayConfig: PaymentGatewayConfig;
}

export const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  onPaymentSuccess,
  onPaymentError,
  amount,
  isProcessing = false,
  gatewayConfig
}) => {
  const [processingPayment, setProcessingPayment] = useState(false);

  // Handle payment method creation from Braintree or Authorize.Net
  const handlePaymentMethodCreated = async (result: PaymentProcessingResult) => {
    if (result.success && result.paymentMethodId) {
      console.log('✅ Payment method created successfully:', result);
      onPaymentSuccess(result.paymentMethodId, result.details);
    } else {
      console.error('❌ Payment method creation failed:', result.error);
      onPaymentError(result.error || 'Payment processing failed');
    }
  };

  // Handle Stripe payment success
  const handleStripePaymentSuccess = async (result: StripePaymentResult) => {
    if (result.success && result.sessionId) {
      console.log('✅ Stripe payment completed successfully:', result);
      onPaymentSuccess(result.sessionId, result.details);
    } else {
      console.error('❌ Stripe payment failed:', result.error);
      onPaymentError(result.error || 'Stripe payment failed');
    }
  };

  // Handle payment errors
  const handlePaymentError = (error: string) => {
    console.error('❌ Payment error:', error);
    setProcessingPayment(false);
    onPaymentError(error);
  };

  if (!gatewayConfig) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-yellow-800 font-medium text-sm">Gateway Configuration Missing</h4>
            <p className="text-yellow-600 text-xs mt-1">Payment gateway information is not available</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine which payment processor to use based on gateway
  const gatewayName = gatewayConfig.gatewayName?.toLowerCase();

  // Debug logging
  console.log('🔍 PaymentProcessor Debug:', {
    gatewayName,
    gatewayConfig,
    amount
  });

  return (
    <div className="space-y-6">
      {/* Payment Processor Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Complete Your Payment</h3>
        <p className="text-sm text-gray-600">
          Total: <span className="font-semibold">${amount.toFixed(2)}</span>
        </p>
      </div>

      {/* Conditional Payment Form */}
      {gatewayName === 'stripe' ? (
        <StripeCheckout
          onPaymentSuccess={handleStripePaymentSuccess}
          onPaymentError={handlePaymentError}
          amount={amount}
          isProcessing={isProcessing || processingPayment}
          apiBaseUrl={gatewayConfig.apiBaseUrl}
        />
      ) : gatewayName === 'braintree' ? (
        <BraintreeDropIn
          onPaymentMethodCreated={handlePaymentMethodCreated}
          onError={handlePaymentError}
          amount={amount}
          isProcessing={isProcessing || processingPayment}
          apiBaseUrl={gatewayConfig.apiBaseUrl}
        />
      ) : gatewayName === 'authorizeddotnet' || gatewayName === 'authorize.net' ? (
        <AuthorizeNetForm
          onPaymentMethodCreated={handlePaymentMethodCreated}
          onError={handlePaymentError}
          amount={amount}
          isProcessing={isProcessing || processingPayment}
          apiBaseUrl={gatewayConfig.apiBaseUrl}
        />
      ) : (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-red-800 font-medium text-sm">Unsupported Payment Gateway</h4>
              <p className="text-red-600 text-xs mt-1">
                Gateway "{gatewayName}" is not supported. Please contact support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="text-center text-xs text-gray-500 mt-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Your payment information is secure and encrypted</span>
        </div>
        <p>Gateway: {gatewayConfig.gatewayName}</p>
      </div>
    </div>
  );
};