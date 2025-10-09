/**
 * Currency Utilities
 * Format and parse currency amounts
 */
export interface CurrencyOptions {
    currency?: string;
    locale?: string;
    decimals?: number;
    symbol?: boolean;
}
/**
 * Format amount as currency
 */
export declare function formatCurrency(amount: number, options?: CurrencyOptions): string;
/**
 * Parse currency string to number
 */
export declare function parseCurrency(formattedAmount: string): number;
/**
 * Convert cents to dollars (or smallest unit to major unit)
 */
export declare function centsToUSD(cents: number): string;
/**
 * Convert dollars to cents (or major unit to smallest unit)
 */
export declare function usdToCents(dollars: number): number;
/**
 * Get currency symbol
 */
export declare function getCurrencySymbol(currency: string, locale?: string): string;
/**
 * Get number of decimal places for currency
 */
export declare function getCurrencyDecimals(currency: string): number;
/**
 * Convert amount to smallest unit (e.g., dollars to cents)
 */
export declare function toSmallestUnit(amount: number, currency: string): number;
/**
 * Convert amount from smallest unit (e.g., cents to dollars)
 */
export declare function fromSmallestUnit(amount: number, currency: string): number;
/**
 * Format amount with currency code
 */
export declare function formatWithCode(amount: number, currency: string, locale?: string): string;
/**
 * Validate currency code
 */
export declare function isValidCurrency(currency: string): boolean;
/**
 * Get currency name
 */
export declare function getCurrencyName(currency: string): string;
/**
 * Compare two amounts (handles floating point precision)
 */
export declare function compareAmounts(amount1: number, amount2: number, epsilon?: number): number;
/**
 * Round amount to currency precision
 */
export declare function roundToCurrency(amount: number, currency: string): number;
/**
 * Format amount for display in different contexts
 */
export interface FormatContext {
    short?: boolean;
    compact?: boolean;
    signed?: boolean;
}
export declare function formatAmount(amount: number, currency: string, context?: FormatContext): string;
//# sourceMappingURL=currency.d.ts.map