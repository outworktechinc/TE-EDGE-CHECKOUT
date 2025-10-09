/**
 * Stripe Payment Gateway Integration
 * Framework-agnostic implementation
 */
import { PaymentError, PaymentErrorCode } from "../types";
import { loadScript } from "../utils";
const STRIPE_JS_URL = "https://js.stripe.com/v3/";
let stripeInstance = null;
let stripeReadyPromise = null;
/**
 * Get Stripe publishable key from configuration
 */
function getStripePublishableKey(adapter) {
    const key = adapter.getConfig("stripePublishableKey");
    if (!key) {
        throw new PaymentError(PaymentErrorCode.CONFIG_MISSING, "Missing Stripe configuration: stripePublishableKey required");
    }
    if (!key.startsWith("pk_")) {
        throw new PaymentError(PaymentErrorCode.SDK_LOAD_FAILED, "Invalid Stripe publishable key format - must start with pk_");
    }
    return key;
}
/**
 * Initialize Stripe SDK
 */
export async function initializeStripe(adapter) {
    if (!adapter.isBrowser()) {
        throw new PaymentError(PaymentErrorCode.SDK_LOAD_FAILED, "Cannot initialize Stripe in server environment");
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
            await loadScript(STRIPE_JS_URL, adapter);
            if (!window.Stripe) {
                throw new PaymentError(PaymentErrorCode.SDK_LOAD_FAILED, "Stripe.js loaded but window.Stripe is undefined");
            }
            const publishableKey = getStripePublishableKey(adapter);
            stripeInstance = window.Stripe(publishableKey);
            console.debug("[Stripe] Initialization complete");
        }
        catch (error) {
            stripeReadyPromise = null;
            if (error instanceof PaymentError) {
                throw error;
            }
            throw new PaymentError(PaymentErrorCode.SDK_LOAD_FAILED, "Failed to initialize Stripe SDK", error);
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
export async function createStripeToken(card, adapter) {
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
            throw new PaymentError(PaymentErrorCode.INVALID_CARD, result.error || "Invalid card details", { code: result.code });
        }
        if (!result.paymentMethodId) {
            throw new PaymentError(PaymentErrorCode.TOKENIZATION_FAILED, "No payment method ID returned");
        }
        console.debug(`[Stripe] Payment method created: ${result.paymentMethodId}`);
        return result.paymentMethodId;
    }
    catch (error) {
        if (error instanceof PaymentError) {
            throw error;
        }
        throw new PaymentError(PaymentErrorCode.TOKENIZATION_FAILED, "Failed to create Stripe payment method", error);
    }
}
/**
 * Reset Stripe instance
 */
export function resetStripe() {
    stripeInstance = null;
    stripeReadyPromise = null;
    console.debug("[Stripe] Reset complete");
}
/**
 * Check if Stripe is ready
 */
export function isStripeReady() {
    return stripeInstance !== null;
}
