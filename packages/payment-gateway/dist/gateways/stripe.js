"use strict";
/**
 * Stripe Payment Gateway Integration
 * Framework-agnostic implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeStripe = initializeStripe;
exports.createStripeToken = createStripeToken;
exports.resetStripe = resetStripe;
exports.isStripeReady = isStripeReady;
const types_1 = require("../types");
const utils_1 = require("../utils");
const STRIPE_JS_URL = "https://js.stripe.com/v3/";
let stripeInstance = null;
let stripeReadyPromise = null;
/**
 * Get Stripe publishable key from configuration
 */
function getStripePublishableKey(adapter) {
    const key = adapter.getConfig("stripePublishableKey");
    if (!key) {
        throw new types_1.PaymentError(types_1.PaymentErrorCode.CONFIG_MISSING, "Missing Stripe configuration: stripePublishableKey required");
    }
    if (!key.startsWith("pk_")) {
        throw new types_1.PaymentError(types_1.PaymentErrorCode.SDK_LOAD_FAILED, "Invalid Stripe publishable key format - must start with pk_");
    }
    return key;
}
/**
 * Initialize Stripe SDK
 */
async function initializeStripe(adapter) {
    if (!adapter.isBrowser()) {
        throw new types_1.PaymentError(types_1.PaymentErrorCode.SDK_LOAD_FAILED, "Cannot initialize Stripe in server environment");
    }
    if (stripeInstance) {
        console.debug("[Stripe] Already initialized");
        return;
    }
    if (stripeReadyPromise) {
        console.debug("[Stripe] Already initializing, waiting...");
        return stripeReadyPromise;
    }
    stripeReadyPromise = (async () => {
        try {
            console.debug("[Stripe] Starting initialization...");
            await (0, utils_1.loadScript)(STRIPE_JS_URL, adapter);
            if (!window.Stripe) {
                throw new types_1.PaymentError(types_1.PaymentErrorCode.SDK_LOAD_FAILED, "Stripe.js loaded but window.Stripe is undefined");
            }
            const publishableKey = getStripePublishableKey(adapter);
            stripeInstance = window.Stripe(publishableKey);
            console.debug("[Stripe] Initialization complete");
        }
        catch (error) {
            stripeReadyPromise = null;
            if (error instanceof types_1.PaymentError) {
                throw error;
            }
            throw new types_1.PaymentError(types_1.PaymentErrorCode.SDK_LOAD_FAILED, "Failed to initialize Stripe SDK", error);
        }
    })();
    return stripeReadyPromise;
}
/**
 * Create payment method token from card details
 *
 * For Edge Checkout scenarios, this calls the backend API endpoint
 * since Stripe doesn't allow raw card data from browser with publishable key
 */
async function createStripeToken(card, adapter) {
    try {
        console.debug("[Stripe] Creating payment method via backend API...");
        const apiBaseUrl = adapter.getConfig("apiBaseUrl") || "";
        const response = await adapter.fetch(`${apiBaseUrl}/api/payments/stripe/create-payment-method`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cardNumber: card.number,
                expMonth: card.expMonth,
                expYear: card.expYear,
                cvc: card.cvc
            })
        });
        const result = await response.json();
        if (!response.ok || result.error) {
            throw new types_1.PaymentError(types_1.PaymentErrorCode.INVALID_CARD, result.error || "Invalid card details", { code: result.code });
        }
        if (!result.paymentMethodId) {
            throw new types_1.PaymentError(types_1.PaymentErrorCode.TOKENIZATION_FAILED, "No payment method ID returned");
        }
        console.debug(`[Stripe] Payment method created: ${result.paymentMethodId}`);
        return result.paymentMethodId;
    }
    catch (error) {
        if (error instanceof types_1.PaymentError) {
            throw error;
        }
        throw new types_1.PaymentError(types_1.PaymentErrorCode.TOKENIZATION_FAILED, "Failed to create Stripe payment method", error);
    }
}
/**
 * Reset Stripe instance
 */
function resetStripe() {
    stripeInstance = null;
    stripeReadyPromise = null;
    console.debug("[Stripe] Reset complete");
}
/**
 * Check if Stripe is ready
 */
function isStripeReady() {
    return stripeInstance !== null;
}
