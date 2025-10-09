"use strict";
/**
 * Braintree Payment Gateway Integration
 * Framework-agnostic implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeBraintree = initializeBraintree;
exports.createBraintreeToken = createBraintreeToken;
exports.resetBraintree = resetBraintree;
exports.isBraintreeReady = isBraintreeReady;
const types_1 = require("../types");
const utils_1 = require("../utils");
let braintreeClientToken = null;
let braintreeReadyPromise = null;
/**
 * Fetch client token from backend
 */
async function fetchClientToken(adapter) {
    try {
        console.debug("[Braintree] Fetching client token from backend...");
        const tokenUrl = adapter.getConfig("braintreeClientTokenUrl");
        const apiBaseUrl = adapter.getConfig("apiBaseUrl") || "";
        const url = tokenUrl || `${apiBaseUrl}/api/braintree/token`;
        const response = await adapter.fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            throw new types_1.PaymentError(types_1.PaymentErrorCode.CLIENT_TOKEN_FAILED, `Failed to fetch Braintree client token: ${response.status}`, { status: response.status });
        }
        const data = await response.json();
        if (!data.clientToken) {
            throw new types_1.PaymentError(types_1.PaymentErrorCode.CLIENT_TOKEN_FAILED, "Backend returned invalid client token response");
        }
        console.debug("[Braintree] Client token received");
        return data.clientToken;
    }
    catch (error) {
        if (error instanceof types_1.PaymentError) {
            throw error;
        }
        throw new types_1.PaymentError(types_1.PaymentErrorCode.CLIENT_TOKEN_FAILED, "Failed to fetch Braintree client token", error);
    }
}
/**
 * Initialize Braintree SDK
 */
async function initializeBraintree(adapter) {
    if (!adapter.isBrowser()) {
        throw new types_1.PaymentError(types_1.PaymentErrorCode.SDK_LOAD_FAILED, "Cannot initialize Braintree in server environment");
    }
    if (braintreeClientToken) {
        console.debug("[Braintree] Already initialized");
        return;
    }
    if (braintreeReadyPromise) {
        console.debug("[Braintree] Already initializing, waiting...");
        return braintreeReadyPromise;
    }
    braintreeReadyPromise = (async () => {
        try {
            console.debug("[Braintree] Starting initialization...");
            braintreeClientToken = await fetchClientToken(adapter);
            console.debug("[Braintree] Initialization complete (client token fetched)");
        }
        catch (error) {
            braintreeReadyPromise = null;
            braintreeClientToken = null;
            if (error instanceof types_1.PaymentError) {
                throw error;
            }
            throw new types_1.PaymentError(types_1.PaymentErrorCode.SDK_LOAD_FAILED, "Failed to initialize Braintree SDK", error);
        }
    })();
    return braintreeReadyPromise;
}
/**
 * Create payment method nonce from card details
 */
async function createBraintreeToken(card, adapter) {
    try {
        console.debug("[Braintree] Creating payment method nonce...");
        if (!braintreeClientToken) {
            console.debug("[Braintree] Fetching client token...");
            braintreeClientToken = await fetchClientToken(adapter);
        }
        await (0, utils_1.loadScript)("https://js.braintreegateway.com/web/3.97.2/js/client.min.js", adapter);
        if (!window.braintree?.client) {
            throw new types_1.PaymentError(types_1.PaymentErrorCode.SDK_LOAD_FAILED, "Braintree client SDK not loaded");
        }
        console.debug("[Braintree] Creating client instance...");
        const clientInstance = await window.braintree.client.create({
            authorization: braintreeClientToken
        });
        console.debug("[Braintree] Tokenizing card data...");
        const tokenizePayload = await clientInstance.request({
            endpoint: 'payment_methods/credit_cards',
            method: 'post',
            data: {
                creditCard: {
                    number: card.number,
                    expirationMonth: card.expMonth,
                    expirationYear: card.expYear,
                    cvv: card.cvc
                }
            }
        });
        if (!tokenizePayload.creditCards?.[0]?.nonce) {
            throw new types_1.PaymentError(types_1.PaymentErrorCode.TOKENIZATION_FAILED, "Braintree returned no payment method nonce");
        }
        const nonce = tokenizePayload.creditCards[0].nonce;
        console.debug(`[Braintree] Payment method nonce created: ${nonce}`);
        return nonce;
    }
    catch (error) {
        if (error instanceof types_1.PaymentError) {
            throw error;
        }
        throw new types_1.PaymentError(types_1.PaymentErrorCode.TOKENIZATION_FAILED, "Failed to create Braintree payment method", error);
    }
}
/**
 * Reset Braintree instance
 */
function resetBraintree() {
    braintreeClientToken = null;
    braintreeReadyPromise = null;
    console.debug("[Braintree] Reset complete");
}
/**
 * Check if Braintree is ready
 */
function isBraintreeReady() {
    return braintreeClientToken !== null;
}
