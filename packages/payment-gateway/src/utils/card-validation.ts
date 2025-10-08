/**
 * Card Validation Utilities
 * Provides comprehensive validation for credit card details
 */

import { CardInput } from '../types';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unknown';

export interface CardValidationResult {
  isValid: boolean;
  cardBrand: CardBrand;
  errors: string[];
}

/**
 * Validate card number using Luhn algorithm
 */
export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\D/g, '');

  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Detect card brand from card number
 */
export function detectCardBrand(cardNumber: string): CardBrand {
  const cleaned = cardNumber.replace(/\s/g, '');

  const patterns: Record<CardBrand, RegExp> = {
    visa: /^4/,
    mastercard: /^5[1-5]|^2(22[1-9]|2[3-9]|[3-6]|7[01]|720)/,
    amex: /^3[47]/,
    discover: /^6011|^64[4-9]|^65|^622/,
    diners: /^3(?:0[0-5]|[68])/,
    jcb: /^35/,
    unknown: /.*/
  };

  for (const [brand, pattern] of Object.entries(patterns)) {
    if (brand !== 'unknown' && pattern.test(cleaned)) {
      return brand as CardBrand;
    }
  }

  return 'unknown';
}

/**
 * Validate expiry date
 */
export function validateExpiryDate(month: string, year: string): boolean {
  const expMonth = parseInt(month, 10);
  let expYear = parseInt(year, 10);

  if (isNaN(expMonth) || isNaN(expYear)) {
    return false;
  }

  if (expMonth < 1 || expMonth > 12) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Handle 2-digit year (e.g., 25 -> 2025)
  if (expYear < 100) {
    expYear = 2000 + expYear;
  }

  if (expYear < currentYear) {
    return false;
  }

  if (expYear === currentYear && expMonth < currentMonth) {
    return false;
  }

  return true;
}

/**
 * Validate CVV/CVC
 */
export function validateCVV(cvv: string, cardBrand: CardBrand): boolean {
  const cleaned = cvv.replace(/\D/g, '');

  // American Express requires 4 digits, others require 3
  if (cardBrand === 'amex') {
    return cleaned.length === 4;
  }

  return cleaned.length === 3 || cleaned.length === 4;
}

/**
 * Comprehensive card validation
 */
export function validateCard(card: CardInput): CardValidationResult {
  const errors: string[] = [];
  const cleaned = card.number.replace(/\s/g, '');

  // Validate card number
  if (!cleaned) {
    errors.push('Card number is required');
  } else if (!validateCardNumber(cleaned)) {
    errors.push('Invalid card number');
  }

  // Detect card brand
  const cardBrand = detectCardBrand(cleaned);

  // Validate expiry
  if (!card.expMonth) {
    errors.push('Expiry month is required');
  } else if (!card.expYear) {
    errors.push('Expiry year is required');
  } else if (!validateExpiryDate(card.expMonth, card.expYear)) {
    errors.push('Card is expired or invalid expiry date');
  }

  // Validate CVV
  if (!card.cvc) {
    errors.push('CVV is required');
  } else if (!validateCVV(card.cvc, cardBrand)) {
    const requiredLength = cardBrand === 'amex' ? '4' : '3';
    errors.push(`Invalid CVV (${requiredLength} digits required for ${cardBrand})`);
  }

  return {
    isValid: errors.length === 0,
    cardBrand,
    errors
  };
}

/**
 * Format card number with spaces
 */
export function formatCardNumber(cardNumber: string, cardBrand?: CardBrand): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  const brand = cardBrand || detectCardBrand(cleaned);

  // American Express: 4-6-5 format
  if (brand === 'amex') {
    return cleaned.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
  }

  // Others: 4-4-4-4 format
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Mask card number (show last 4 digits only)
 */
export function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 4) {
    return '•••• •••• •••• ••••';
  }
  const last4 = cleaned.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

/**
 * Get card brand display name
 */
export function getCardBrandName(cardBrand: CardBrand): string {
  const names: Record<CardBrand, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unknown: 'Unknown'
  };
  return names[cardBrand] || 'Unknown';
}
