/**
 * Universal Payment Validation Utilities
 * Standardized validation functions for payment forms
 */

import { ValidationRule, ValidationRules, ValidationResult, PaymentFormData } from '../core/types';

/**
 * Credit card validation utilities
 */
export class CardValidator {
  /**
   * Validate credit card number using Luhn algorithm
   */
  static isValidCardNumber(cardNumber: string): boolean {
    // Remove spaces and non-numeric characters
    const cleaned = cardNumber.replace(/\D/g, '');

    // Check length (most cards are 13-19 digits)
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

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
   * Get card brand from card number
   */
  static getCardBrand(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');

    // Card brand patterns
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]|^2[2-7]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/,
      dinersclub: /^3[068]/,
      jcb: /^(?:2131|1800|35)/
    };

    for (const [brand, pattern] of Object.entries(patterns)) {
      if (pattern.test(cleaned)) {
        return brand;
      }
    }

    return 'unknown';
  }

  /**
   * Validate expiry month
   */
  static isValidExpiryMonth(month: string): boolean {
    const monthNum = parseInt(month, 10);
    return monthNum >= 1 && monthNum <= 12;
  }

  /**
   * Validate expiry year
   */
  static isValidExpiryYear(year: string): boolean {
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year, 10);

    // Support both 2-digit and 4-digit years
    const fullYear = yearNum < 100 ? 2000 + yearNum : yearNum;

    return fullYear >= currentYear && fullYear <= currentYear + 20;
  }

  /**
   * Check if card is expired
   */
  static isCardExpired(month: string, year: string): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11

    const expiryMonth = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    const expiryYear = yearNum < 100 ? 2000 + yearNum : yearNum;

    if (expiryYear < currentYear) {
      return true;
    }

    if (expiryYear === currentYear && expiryMonth < currentMonth) {
      return true;
    }

    return false;
  }

  /**
   * Validate CVV/CVC code
   */
  static isValidCvv(cvv: string, cardBrand?: string): boolean {
    const cleaned = cvv.replace(/\D/g, '');

    // American Express uses 4-digit CVV, others use 3-digit
    const expectedLength = cardBrand === 'amex' ? 4 : 3;

    return cleaned.length === expectedLength;
  }
}

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Phone validation (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Postal code validation
 */
export function isValidPostalCode(postalCode: string, country: string = 'US'): boolean {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/,
    UK: /^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/
  };

  const pattern = patterns[country.toUpperCase()];
  return pattern ? pattern.test(postalCode) : postalCode.length >= 3;
}

/**
 * Format card number with spaces
 */
export function formatCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  const brand = CardValidator.getCardBrand(cleaned);

  // American Express: 4-6-5 format
  if (brand === 'amex') {
    return cleaned.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
  }

  // Most other cards: 4-4-4-4 format
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Format expiry date as MM/YY
 */
export function formatExpiryDate(month: string, year: string): string {
  const monthPadded = month.padStart(2, '0');
  const yearShort = year.length === 4 ? year.slice(2) : year;
  return `${monthPadded}/${yearShort}`;
}

/**
 * Validate form field based on rules
 */
export function validateField(value: any, rules: ValidationRule): string | null {
  if (rules.required && (!value || value.toString().trim() === '')) {
    return 'This field is required';
  }

  if (!value) return null; // Skip other validations if field is empty and not required

  const stringValue = value.toString();

  if (rules.minLength && stringValue.length < rules.minLength) {
    return `Minimum length is ${rules.minLength} characters`;
  }

  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `Maximum length is ${rules.maxLength} characters`;
  }

  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return 'Invalid format';
  }

  if (rules.custom) {
    const result = rules.custom(value);
    if (typeof result === 'string') {
      return result;
    }
    if (result === false) {
      return 'Invalid value';
    }
  }

  return null;
}

/**
 * Validate entire payment form
 */
export function validatePaymentForm(
  data: PaymentFormData,
  rules: ValidationRules = {}
): ValidationResult {
  const errors: Record<string, string> = {};

  // Default validation rules
  const defaultRules: ValidationRules = {
    cardNumber: {
      required: true,
      custom: (value: string) => CardValidator.isValidCardNumber(value) || 'Invalid card number'
    },
    expiryMonth: {
      required: true,
      custom: (value: string) => CardValidator.isValidExpiryMonth(value) || 'Invalid month'
    },
    expiryYear: {
      required: true,
      custom: (value: string) => CardValidator.isValidExpiryYear(value) || 'Invalid year'
    },
    cvv: {
      required: true,
      custom: (value: string) => {
        const brand = data.cardNumber ? CardValidator.getCardBrand(data.cardNumber) : undefined;
        return CardValidator.isValidCvv(value, brand) || 'Invalid CVV';
      }
    },
    holderName: {
      required: true,
      minLength: 2
    },
    email: {
      custom: (value: string) => value ? (isValidEmail(value) || 'Invalid email') : true
    }
  };

  // Merge with custom rules
  const finalRules = { ...defaultRules, ...rules };

  // Validate each field
  for (const [field, value] of Object.entries(data)) {
    const fieldRules = finalRules[field];
    if (fieldRules) {
      const error = validateField(value, fieldRules);
      if (error) {
        errors[field] = error;
      }
    }
  }

  // Cross-field validation
  if (data.expiryMonth && data.expiryYear) {
    if (CardValidator.isCardExpired(data.expiryMonth, data.expiryYear)) {
      errors.expiryMonth = 'Card has expired';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Sanitize and format form data
 */
export function sanitizePaymentFormData(data: PaymentFormData): PaymentFormData {
  return {
    ...data,
    cardNumber: data.cardNumber?.replace(/\D/g, ''),
    expiryMonth: data.expiryMonth?.padStart(2, '0'),
    cvv: data.cvv?.replace(/\D/g, ''),
    holderName: data.holderName?.trim(),
    email: data.email?.trim().toLowerCase()
  };
}