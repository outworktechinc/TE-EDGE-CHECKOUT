/**
 * Universal Authorize.Net Form Component
 * Extracted and adapted from Ombee Mobile AuthorizeNetForm.tsx
 */

import React, { useEffect, useState } from 'react';
import { PaymentProcessingService } from '../services/PaymentProcessingService';
import { PaymentProcessingResult, AuthorizeNetCardData } from '../types/payment';

interface AuthorizeNetFormProps {
  onPaymentMethodCreated: (result: PaymentProcessingResult) => void;
  onError: (error: string) => void;
  amount?: number;
  isProcessing?: boolean;
  apiBaseUrl: string;
}

export const AuthorizeNetForm: React.FC<AuthorizeNetFormProps> = ({
  onPaymentMethodCreated,
  onError,
  amount = 0,
  isProcessing = false,
  apiBaseUrl
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [paymentService] = useState(() => new PaymentProcessingService(apiBaseUrl));

  // Form state
  const [cardData, setCardData] = useState<AuthorizeNetCardData>({
    cardNumber: '',
    month: '',
    year: '',
    cardCode: ''
  });

  // Form validation state
  const [errors, setErrors] = useState<Partial<AuthorizeNetCardData>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof AuthorizeNetCardData, boolean>>>({});

  // Initialize Authorize.Net when component mounts
  useEffect(() => {
    const initializeAuthorizeNet = async () => {
      try {
        setIsLoading(true);
        setInitError(null);

        await paymentService.initializeAuthorizeNet();
        setIsInitialized(true);
        console.log('✅ Authorize.Net Accept.js initialized');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize Authorize.Net';
        console.error('❌ Authorize.Net initialization failed:', errorMessage);
        setInitError(errorMessage);
        onError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuthorizeNet();
  }, [onError, paymentService]);

  // Validation functions
  const validateCardNumber = (cardNumber: string): string | null => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!cleaned) return 'Card number is required';
    if (!/^\d{13,19}$/.test(cleaned)) return 'Please enter a valid card number';
    return null;
  };

  const validateMonth = (month: string): string | null => {
    if (!month) return 'Month is required';
    const monthNum = parseInt(month, 10);
    if (monthNum < 1 || monthNum > 12) return 'Please enter a valid month (01-12)';
    return null;
  };

  const validateYear = (year: string): string | null => {
    if (!year) return 'Year is required';
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year, 10);
    if (yearNum < currentYear || yearNum > currentYear + 20) return 'Please enter a valid year';
    return null;
  };

  const validateCardCode = (cardCode: string): string | null => {
    if (!cardCode) return 'CVV is required';
    if (!/^\d{3,4}$/.test(cardCode)) return 'Please enter a valid CVV (3-4 digits)';
    return null;
  };

  // Handle field changes
  const handleFieldChange = (field: keyof AuthorizeNetCardData, value: string) => {
    let formattedValue = value;

    // Format card number with spaces
    if (field === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      if (formattedValue.replace(/\s/g, '').length > 19) return;
    }

    // Format month with leading zero
    if (field === 'month') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 2) return;
      if (formattedValue.length === 1 && parseInt(formattedValue) > 1) {
        formattedValue = '0' + formattedValue;
      }
    }

    // Format year (4 digits)
    if (field === 'year') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 4) return;
    }

    // Format CVV (3-4 digits only)
    if (field === 'cardCode') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 4) return;
    }

    setCardData(prev => ({ ...prev, [field]: formattedValue }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle field blur
  const handleFieldBlur = (field: keyof AuthorizeNetCardData) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate field
    let error: string | null = null;
    switch (field) {
      case 'cardNumber':
        error = validateCardNumber(cardData.cardNumber);
        break;
      case 'month':
        error = validateMonth(cardData.month);
        break;
      case 'year':
        error = validateYear(cardData.year);
        break;
      case 'cardCode':
        error = validateCardCode(cardData.cardCode);
        break;
    }

    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: Partial<AuthorizeNetCardData> = {};

    const cardNumberError = validateCardNumber(cardData.cardNumber);
    const monthError = validateMonth(cardData.month);
    const yearError = validateYear(cardData.year);
    const cardCodeError = validateCardCode(cardData.cardCode);

    if (cardNumberError) newErrors.cardNumber = cardNumberError;
    if (monthError) newErrors.month = monthError;
    if (yearError) newErrors.year = yearError;
    if (cardCodeError) newErrors.cardCode = cardCodeError;

    setErrors(newErrors);
    setTouched({
      cardNumber: true,
      month: true,
      year: true,
      cardCode: true
    });

    return Object.keys(newErrors).length === 0;
  };

  // Handle payment processing
  const handlePayment = async () => {
    if (!isInitialized) {
      onError('Authorize.Net not initialized');
      return;
    }

    if (!validateForm()) {
      onError('Please correct the form errors');
      return;
    }

    try {
      // Prepare card data for Authorize.Net
      const authorizeNetCardData: AuthorizeNetCardData = {
        cardNumber: cardData.cardNumber.replace(/\s/g, ''), // Remove spaces
        month: cardData.month.padStart(2, '0'), // Ensure 2 digits
        year: cardData.year,
        cardCode: cardData.cardCode
      };

      const result = await paymentService.processAuthorizeNetPayment(authorizeNetCardData);
      onPaymentMethodCreated(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      onError(errorMessage);
    }
  };

  // Get field CSS classes
  const getFieldClasses = (field: keyof AuthorizeNetCardData): string => {
    const baseClasses = "w-full h-[56px] px-4 rounded-[12px] border bg-white focus:outline-none focus:ring-2 focus:ring-black";
    const errorClasses = "border-red-500";
    const normalClasses = "border-gray-300";

    const hasError = touched[field] && errors[field];
    return `${baseClasses} ${hasError ? errorClasses : normalClasses}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <p className="text-sm text-gray-600">Loading payment form...</p>
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
    <div className="space-y-6">
      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium mb-2">Card Number*</label>
        <input
          type="text"
          placeholder="1234 5678 9012 3456"
          value={cardData.cardNumber}
          onChange={(e) => handleFieldChange('cardNumber', e.target.value)}
          onBlur={() => handleFieldBlur('cardNumber')}
          className={getFieldClasses('cardNumber')}
          maxLength={23} // 19 digits + 4 spaces
        />
        {touched.cardNumber && errors.cardNumber && (
          <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
        )}
      </div>

      {/* Expiry and CVV */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Month*</label>
          <input
            type="text"
            placeholder="MM"
            value={cardData.month}
            onChange={(e) => handleFieldChange('month', e.target.value)}
            onBlur={() => handleFieldBlur('month')}
            className={getFieldClasses('month')}
            maxLength={2}
          />
          {touched.month && errors.month && (
            <p className="text-red-500 text-xs mt-1">{errors.month}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Year*</label>
          <input
            type="text"
            placeholder="YYYY"
            value={cardData.year}
            onChange={(e) => handleFieldChange('year', e.target.value)}
            onBlur={() => handleFieldBlur('year')}
            className={getFieldClasses('year')}
            maxLength={4}
          />
          {touched.year && errors.year && (
            <p className="text-red-500 text-xs mt-1">{errors.year}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">CVV*</label>
          <input
            type="text"
            placeholder="123"
            value={cardData.cardCode}
            onChange={(e) => handleFieldChange('cardCode', e.target.value)}
            onBlur={() => handleFieldBlur('cardCode')}
            className={getFieldClasses('cardCode')}
            maxLength={4}
          />
          {touched.cardCode && errors.cardCode && (
            <p className="text-red-500 text-xs mt-1">{errors.cardCode}</p>
          )}
        </div>
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

      {/* Development Mode Notice */}
      {isInitialized && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-yellow-800">Development Mode</span>
          </div>
          <p className="text-xs text-yellow-600 mt-1">Card processing will be simulated - use any test data</p>
        </div>
      )}

      {/* Payment Info */}
      <div className="text-xs text-gray-500 text-center">
        <p>Secure payment powered by Authorize.Net</p>
        <div className="flex justify-center gap-4 mt-2">
          <span>💳 Credit Cards</span>
          <span>🔒 256-bit SSL</span>
          <span>🛡️ PCI Compliant</span>
        </div>
      </div>
    </div>
  );
};