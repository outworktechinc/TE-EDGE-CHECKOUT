/**
 * Universal Payment Processor Component
 * Enhanced version with modular gateway support and better error handling
 */

import React, { useState, useCallback, useMemo } from 'react';
import { BasePaymentComponentProps, PaymentConfig } from './types';
import { PaymentError, createPaymentError, PaymentErrorCode } from './errors';
import { createGatewayLogger } from '../utils/logger';
import { StripeCheckout } from '../stripe/StripeCheckout';
import { StripeConfig, BraintreeConfig, AuthorizeNetConfig } from './config';

// Lazy load components for better bundle splitting
const BraintreeDropIn = React.lazy(() =>
  import('../components/BraintreeDropIn').then(module => ({ default: module.BraintreeDropIn }))
);
const AuthorizeNetForm = React.lazy(() =>
  import('../components/AuthorizeNetForm').then(module => ({ default: module.AuthorizeNetForm }))
);

interface PaymentProcessorProps extends BasePaymentComponentProps {
  config: PaymentConfig;
  showGatewayInfo?: boolean;
  theme?: 'light' | 'dark';
  customization?: {
    borderRadius?: number;
    primaryColor?: string;
    fontFamily?: string;
  };
}

export const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  amount,
  currency = 'USD',
  customer,
  onSuccess,
  onError,
  onCancel,
  loading = false,
  disabled = false,
  config,
  showGatewayInfo = true,
  theme = 'light',
  customization,
  className,
  style
}) => {
  const [processingPayment, setProcessingPayment] = useState(false);
  const logger = createGatewayLogger('payment-processor');

  // Memoized gateway detection
  const gatewayInfo = useMemo(() => {
    const gateway = config.gateway.toLowerCase();
    return {
      name: gateway,
      displayName: gateway === 'authorize.net' ? 'Authorize.Net' :
                   gateway.charAt(0).toUpperCase() + gateway.slice(1),
      isSupported: ['stripe', 'braintree', 'authorize.net'].includes(gateway)
    };
  }, [config.gateway]);

  // Enhanced error handler with logging
  const handlePaymentError = useCallback((error: PaymentError | string) => {
    const paymentError = typeof error === 'string'
      ? createPaymentError(PaymentErrorCode.PROCESSING_ERROR, error, config.gateway)
      : error;

    logger.error('Payment processing failed', {
      gateway: config.gateway,
      error: paymentError.toJSON()
    });

    setProcessingPayment(false);
    onError(paymentError);
  }, [config.gateway, logger, onError]);

  // Enhanced success handler with logging
  const handlePaymentSuccess = useCallback((paymentMethodId: string, details?: any) => {
    logger.info('Payment processing succeeded', {
      gateway: config.gateway,
      paymentMethodId,
      amount,
      currency
    });

    setProcessingPayment(false);
    onSuccess({
      success: true,
      paymentIntent: {
        id: paymentMethodId,
        amount,
        currency,
        status: 'succeeded',
        created: new Date(),
        updated: new Date()
      },
      metadata: details
    });
  }, [config.gateway, logger, amount, currency, onSuccess]);

  const isProcessing = loading || processingPayment;

  // Error state for unsupported gateways
  if (!gatewayInfo.isSupported) {
    return (
      <div className={`p-6 rounded-lg border ${
        theme === 'dark'
          ? 'bg-red-900 border-red-700'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          <svg className={`w-5 h-5 ${
            theme === 'dark' ? 'text-red-400' : 'text-red-500'
          }`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className={`font-medium text-sm ${
              theme === 'dark' ? 'text-red-300' : 'text-red-800'
            }`}>
              Unsupported Payment Gateway
            </h4>
            <p className={`text-xs mt-1 ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`}>
              Gateway "{config.gateway}" is not supported. Supported gateways: Stripe, Braintree, Authorize.Net
            </p>
          </div>
        </div>
      </div>
    );
  }

  const commonProps = {
    amount,
    currency,
    customer,
    onSuccess: handlePaymentSuccess,
    onError: handlePaymentError,
    onCancel,
    loading: isProcessing,
    disabled: disabled || isProcessing,
    style: {
      ...style,
      fontFamily: customization?.fontFamily,
      '--primary-color': customization?.primaryColor,
      '--border-radius': customization?.borderRadius ? `${customization.borderRadius}px` : undefined
    } as React.CSSProperties
  };

  return (
    <div className={`payment-processor ${className || ''}`} style={style}>
      {/* Gateway Header */}
      {showGatewayInfo && (
        <div className={`text-center mb-6 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <h3 className="text-lg font-semibold mb-2">Complete Your Payment</h3>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span>Total: </span>
            <span className="font-bold">{currency} {amount.toFixed(2)}</span>
            {customer?.email && (
              <>
                <span className="mx-2">•</span>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  {customer.email}
                </span>
              </>
            )}
          </div>
          <p className={`text-xs mt-2 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Powered by {gatewayInfo.displayName}
          </p>
        </div>
      )}

      {/* Gateway-specific Component */}
      <React.Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
        </div>
      }>
        {config.gateway === 'stripe' && (
          <StripeCheckout
            {...commonProps}
            config={config as StripeConfig}
            customization={{
              theme,
              borderRadius: customization?.borderRadius
            }}
          />
        )}

        {config.gateway === 'braintree' && (
          <BraintreeDropIn
            {...commonProps}
            config={config as BraintreeConfig}
          />
        )}

        {config.gateway === 'authorize.net' && (
          <AuthorizeNetForm
            {...commonProps}
            config={config as AuthorizeNetConfig}
          />
        )}
      </React.Suspense>

      {/* Security Notice */}
      <div className={`text-center text-xs mt-6 ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Your payment information is secure and encrypted</span>
        </div>
        <div className="flex justify-center gap-4">
          <span>🔒 SSL Secure</span>
          <span>🛡️ PCI Compliant</span>
          <span>💳 All Major Cards</span>
        </div>
      </div>
    </div>
  );
};