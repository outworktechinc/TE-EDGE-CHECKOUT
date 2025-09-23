/**
 * Enhanced Stripe Checkout Component
 * Improved version with better error handling and configuration
 */

import React, { useState, useCallback } from 'react';
import { GatewayComponentProps } from '../core/types';
import { PaymentError, createPaymentError, PaymentErrorCode } from '../core/errors';
import { StripeConfig } from '../core/config';
import { createGatewayLogger } from '../utils/logger';
import { StripeService } from './StripeService';
import { StripePaymentResult } from './types';

interface StripeCheckoutProps extends GatewayComponentProps {
  config: StripeConfig;
  showTestModeWarning?: boolean;
  customization?: {
    buttonText?: string;
    theme?: 'light' | 'dark';
    borderRadius?: number;
  };
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  amount,
  currency = 'USD',
  customer,
  onSuccess,
  onError,
  onCancel,
  loading = false,
  disabled = false,
  config,
  showTestModeWarning = true,
  customization,
  className,
  style
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [stripeService] = useState(() => new StripeService());
  const logger = createGatewayLogger('stripe');

  // Initialize service on mount
  React.useEffect(() => {
    const initializeService = async () => {
      try {
        await stripeService.initialize(config);
      } catch (error) {
        logger.error('Failed to initialize Stripe service', { error });
        onError(error as PaymentError);
      }
    };

    initializeService();

    return () => {
      stripeService.cleanup();
    };
  }, [config, stripeService, logger, onError]);

  const handleStripeCheckout = useCallback(async () => {
    if (disabled || loading || isRedirecting) return;

    try {
      setIsRedirecting(true);
      logger.info('Initiating Stripe checkout', { amount, currency });

      const sessionData = {
        amount: amount,
        currency: currency,
        customerEmail: customer?.email,
        metadata: {
          integration: 'universal-payments-nextjs',
          timestamp: new Date().toISOString()
        }
      };

      // Redirect to Stripe Checkout
      await stripeService.redirectToCheckout(sessionData);

    } catch (error) {
      logger.error('Stripe checkout failed', { error });
      setIsRedirecting(false);

      const paymentError = error instanceof PaymentError
        ? error
        : createPaymentError(
            PaymentErrorCode.PROCESSING_ERROR,
            error instanceof Error ? error.message : 'Failed to redirect to Stripe',
            'stripe',
            error
          );

      onError(paymentError);
    }
  }, [
    amount,
    currency,
    customer,
    disabled,
    loading,
    isRedirecting,
    stripeService,
    logger,
    onError
  ]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const isProcessing = loading || isRedirecting;
  const isTestMode = config.publishableKey?.includes('pk_test') || config.environment === 'development';

  const buttonText = customization?.buttonText || `Pay $${amount.toFixed(2)}`;
  const theme = customization?.theme || 'light';

  return (
    <div className={`stripe-checkout-container ${className || ''}`} style={style}>
      {/* Stripe Checkout Info */}
      <div className={`p-4 rounded-lg border ${
        theme === 'dark'
          ? 'bg-blue-900 border-blue-700'
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded flex items-center justify-center ${
            theme === 'dark' ? 'bg-blue-600' : 'bg-blue-600'
          }`}>
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <div>
            <h4 className={`font-medium text-sm ${
              theme === 'dark' ? 'text-blue-100' : 'text-blue-800'
            }`}>
              Stripe Checkout
            </h4>
            <p className={`text-xs mt-1 ${
              theme === 'dark' ? 'text-blue-200' : 'text-blue-600'
            }`}>
              You'll be redirected to secure Stripe payment page
            </p>
          </div>
        </div>
      </div>

      {/* Payment Amount Display */}
      <div className={`rounded-lg p-4 mt-4 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <div className="flex justify-between items-center">
          <span className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Payment Amount:
          </span>
          <span className={`text-lg font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {currency} {amount.toFixed(2)}
          </span>
        </div>
        {customer?.email && (
          <div className="flex justify-between items-center mt-2">
            <span className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Customer:
            </span>
            <span className={`text-xs ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {customer.email}
            </span>
          </div>
        )}
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleStripeCheckout}
        disabled={disabled || isProcessing}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 mt-4 ${
          !disabled && !isProcessing
            ? `${theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              } transform hover:scale-[1.02] active:scale-[0.98]`
            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
        }`}
        style={{ borderRadius: customization?.borderRadius }}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isRedirecting ? 'Redirecting to Stripe...' : 'Processing...'}
          </div>
        ) : (
          buttonText
        )}
      </button>

      {/* Cancel Button (if onCancel is provided) */}
      {onCancel && !isProcessing && (
        <button
          onClick={handleCancel}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors mt-2 ${
            theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Cancel
        </button>
      )}

      {/* Payment Security Info */}
      <div className={`text-xs text-center mt-4 ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <p>Secure payment powered by Stripe</p>
        <div className="flex justify-center gap-4 mt-2">
          <span>💳 All Cards</span>
          <span>🔒 SSL Secure</span>
          <span>🛡️ PCI Compliant</span>
        </div>
      </div>

      {/* Test Mode Warning */}
      {isTestMode && showTestModeWarning && (
        <div className={`mt-4 p-3 rounded-lg border ${
          theme === 'dark'
            ? 'bg-yellow-900 border-yellow-700'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2">
            <svg className={`w-4 h-4 ${
              theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'
            }`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-yellow-300' : 'text-yellow-800'
            }`}>
              Test Mode
            </span>
          </div>
          <p className={`text-xs mt-1 ${
            theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
          }`}>
            Using Stripe test environment - use test card 4242 4242 4242 4242
          </p>
        </div>
      )}
    </div>
  );
};