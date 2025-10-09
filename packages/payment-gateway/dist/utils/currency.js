"use strict";
/**
 * Currency Utilities
 * Format and parse currency amounts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = formatCurrency;
exports.parseCurrency = parseCurrency;
exports.centsToUSD = centsToUSD;
exports.usdToCents = usdToCents;
exports.getCurrencySymbol = getCurrencySymbol;
exports.getCurrencyDecimals = getCurrencyDecimals;
exports.toSmallestUnit = toSmallestUnit;
exports.fromSmallestUnit = fromSmallestUnit;
exports.formatWithCode = formatWithCode;
exports.isValidCurrency = isValidCurrency;
exports.getCurrencyName = getCurrencyName;
exports.compareAmounts = compareAmounts;
exports.roundToCurrency = roundToCurrency;
exports.formatAmount = formatAmount;
/**
 * Format amount as currency
 */
function formatCurrency(amount, options = {}) {
    const { currency = 'USD', locale = 'en-US', decimals = 2, symbol = true } = options;
    if (symbol) {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    }
    else {
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    }
}
/**
 * Parse currency string to number
 */
function parseCurrency(formattedAmount) {
    // Remove all non-numeric characters except decimal point and minus sign
    const cleaned = formattedAmount.replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}
/**
 * Convert cents to dollars (or smallest unit to major unit)
 */
function centsToUSD(cents) {
    return formatCurrency(cents / 100, { currency: 'USD' });
}
/**
 * Convert dollars to cents (or major unit to smallest unit)
 */
function usdToCents(dollars) {
    return Math.round(dollars * 100);
}
/**
 * Get currency symbol
 */
function getCurrencySymbol(currency, locale = 'en-US') {
    const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(0);
    // Extract symbol by removing numbers
    return formatted.replace(/\d/g, '').trim();
}
/**
 * Get number of decimal places for currency
 */
function getCurrencyDecimals(currency) {
    // Currencies with no decimal places
    const zeroDecimalCurrencies = [
        'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW',
        'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF',
        'XOF', 'XPF'
    ];
    if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
        return 0;
    }
    // Currencies with 3 decimal places
    const threeDecimalCurrencies = ['BHD', 'JOD', 'KWD', 'OMR', 'TND'];
    if (threeDecimalCurrencies.includes(currency.toUpperCase())) {
        return 3;
    }
    // Most currencies use 2 decimal places
    return 2;
}
/**
 * Convert amount to smallest unit (e.g., dollars to cents)
 */
function toSmallestUnit(amount, currency) {
    const decimals = getCurrencyDecimals(currency);
    return Math.round(amount * Math.pow(10, decimals));
}
/**
 * Convert amount from smallest unit (e.g., cents to dollars)
 */
function fromSmallestUnit(amount, currency) {
    const decimals = getCurrencyDecimals(currency);
    return amount / Math.pow(10, decimals);
}
/**
 * Format amount with currency code
 */
function formatWithCode(amount, currency, locale = 'en-US') {
    const formatted = formatCurrency(amount, { currency, locale });
    return `${formatted} ${currency}`;
}
/**
 * Validate currency code
 */
function isValidCurrency(currency) {
    const validCurrencies = [
        'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
        'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL',
        'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY',
        'COP', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP',
        'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'FOK', 'GBP', 'GEL', 'GGP', 'GHS',
        'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF',
        'IDR', 'ILS', 'IMP', 'INR', 'IQD', 'IRR', 'ISK', 'JEP', 'JMD', 'JOD',
        'JPY', 'KES', 'KGS', 'KHR', 'KID', 'KMF', 'KRW', 'KWD', 'KYD', 'KZT',
        'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD',
        'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN',
        'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK',
        'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR',
        'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SLL', 'SOS', 'SRD',
        'SSP', 'STN', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY',
        'TTD', 'TVD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VES',
        'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XDR', 'XOF', 'XPF', 'YER', 'ZAR',
        'ZMW', 'ZWL'
    ];
    return validCurrencies.includes(currency.toUpperCase());
}
/**
 * Get currency name
 */
function getCurrencyName(currency) {
    const names = {
        USD: 'US Dollar',
        EUR: 'Euro',
        GBP: 'British Pound',
        JPY: 'Japanese Yen',
        CNY: 'Chinese Yuan',
        INR: 'Indian Rupee',
        CAD: 'Canadian Dollar',
        AUD: 'Australian Dollar',
        CHF: 'Swiss Franc',
        SEK: 'Swedish Krona',
        NZD: 'New Zealand Dollar',
        KRW: 'South Korean Won',
        SGD: 'Singapore Dollar',
        HKD: 'Hong Kong Dollar',
        NOK: 'Norwegian Krone',
        MXN: 'Mexican Peso',
        BRL: 'Brazilian Real',
        RUB: 'Russian Ruble',
        ZAR: 'South African Rand',
        TRY: 'Turkish Lira'
    };
    return names[currency.toUpperCase()] || currency.toUpperCase();
}
/**
 * Compare two amounts (handles floating point precision)
 */
function compareAmounts(amount1, amount2, epsilon = 0.01) {
    const diff = amount1 - amount2;
    if (Math.abs(diff) < epsilon) {
        return 0; // Equal
    }
    return diff > 0 ? 1 : -1; // Greater or Less
}
/**
 * Round amount to currency precision
 */
function roundToCurrency(amount, currency) {
    const decimals = getCurrencyDecimals(currency);
    const multiplier = Math.pow(10, decimals);
    return Math.round(amount * multiplier) / multiplier;
}
function formatAmount(amount, currency, context = {}) {
    const { short = false, compact = false, signed = false } = context;
    let formatted;
    if (compact && Math.abs(amount) >= 1000000) {
        formatted = formatCurrency(amount / 1000000, { currency, decimals: 1 }) + 'M';
    }
    else if (short && Math.abs(amount) >= 1000) {
        formatted = formatCurrency(amount / 1000, { currency, decimals: 1 }) + 'K';
    }
    else {
        formatted = formatCurrency(amount, { currency });
    }
    if (signed && amount > 0) {
        formatted = '+' + formatted;
    }
    return formatted;
}
