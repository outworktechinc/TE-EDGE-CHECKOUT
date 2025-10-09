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
export declare function validateCardNumber(cardNumber: string): boolean;
/**
 * Detect card brand from card number
 */
export declare function detectCardBrand(cardNumber: string): CardBrand;
/**
 * Validate expiry date
 */
export declare function validateExpiryDate(month: string, year: string): boolean;
/**
 * Validate CVV/CVC
 */
export declare function validateCVV(cvv: string, cardBrand: CardBrand): boolean;
/**
 * Comprehensive card validation
 */
export declare function validateCard(card: CardInput): CardValidationResult;
/**
 * Format card number with spaces
 */
export declare function formatCardNumber(cardNumber: string, cardBrand?: CardBrand): string;
/**
 * Mask card number (show last 4 digits only)
 */
export declare function maskCardNumber(cardNumber: string): string;
/**
 * Get card brand display name
 */
export declare function getCardBrandName(cardBrand: CardBrand): string;
//# sourceMappingURL=card-validation.d.ts.map