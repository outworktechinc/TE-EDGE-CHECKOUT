"use strict";
/**
 * Authorize.Net Payment Gateway Integration
 * Framework-agnostic implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAuthorizeNet = initializeAuthorizeNet;
exports.createAuthorizeNetToken = createAuthorizeNetToken;
exports.resetAuthorizeNet = resetAuthorizeNet;
exports.isAuthorizeNetReady = isAuthorizeNetReady;
const types_1 = require("../types");
const utils_1 = require("../utils");
const AUTHNET_ACCEPT_JS_URL = "https://js.authorize.net/v3/Accept.js";
let acceptJsReady = false;
let acceptJsReadyPromise = null;
/**
 * Get Authorize.Net credentials from configuration
 */
function getAuthNetAuthData(adapter) {
    const clientKey = adapter.getConfig("authorizeNetClientKey");
    const apiLoginID = adapter.getConfig("authorizeNetApiLoginId");
    if (!clientKey || !apiLoginID) {
        throw new types_1.PaymentError(types_1.PaymentErrorCode.CONFIG_MISSING, "Missing Authorize.Net configuration: authorizeNetClientKey and authorizeNetApiLoginId required");
    }
    return {
        clientKey,
        apiLoginID
    };
}
/**
 * Initialize Authorize.Net Accept.js SDK
 */
async function initializeAuthorizeNet(adapter) {
    if (!adapter.isBrowser()) {
        throw new types_1.PaymentError(types_1.PaymentErrorCode.SDK_LOAD_FAILED, "Cannot initialize Authorize.Net in server environment");
    }
    if (acceptJsReady && window.Accept) {
        console.debug("[Authorize.Net] Already initialized");
        return;
    }
    if (acceptJsReadyPromise) {
        console.debug("[Authorize.Net] Already initializing, waiting...");
        return acceptJsReadyPromise;
    }
    acceptJsReadyPromise = (async () => {
        try {
            console.debug("[Authorize.Net] Starting initialization...");
            await (0, utils_1.loadScript)(AUTHNET_ACCEPT_JS_URL, adapter);
            if (!window.Accept) {
                throw new types_1.PaymentError(types_1.PaymentErrorCode.SDK_LOAD_FAILED, "Accept.js loaded but window.Accept is undefined");
            }
            getAuthNetAuthData(adapter);
            acceptJsReady = true;
            console.debug("[Authorize.Net] Initialization complete");
        }
        catch (error) {
            acceptJsReadyPromise = null;
            if (error instanceof types_1.PaymentError) {
                throw error;
            }
            throw new types_1.PaymentError(types_1.PaymentErrorCode.SDK_LOAD_FAILED, "Failed to initialize Authorize.Net SDK", error);
        }
    })();
    return acceptJsReadyPromise;
}
/**
 * Create payment nonce from card details
 */
async function createAuthorizeNetToken(card, adapter) {
    if (!acceptJsReady || !window.Accept) {
        throw new types_1.PaymentError(types_1.PaymentErrorCode.NOT_READY, "Authorize.Net SDK not initialized. Call initializeAuthorizeNet() first.");
    }
    return new Promise((resolve, reject) => {
        try {
            console.debug("[Authorize.Net] Creating payment nonce...");
            const authData = getAuthNetAuthData(adapter);
            const cardData = {
                cardNumber: card.number.replace(/\s/g, ""),
                month: card.expMonth.padStart(2, "0"),
                year: card.expYear,
                cardCode: card.cvc
            };
            window.Accept.dispatchData({
                authData,
                cardData
            }, (response) => {
                if (response.messages.resultCode === "Error") {
                    const errorMsg = response.messages.message[0]?.text ||
                        "Unknown error from Authorize.Net";
                    reject(new types_1.PaymentError(types_1.PaymentErrorCode.INVALID_CARD, errorMsg, { response }));
                    return;
                }
                if (!response.opaqueData?.dataValue) {
                    reject(new types_1.PaymentError(types_1.PaymentErrorCode.TOKENIZATION_FAILED, "Authorize.Net returned no opaque data value", { response }));
                    return;
                }
                const token = response.opaqueData.dataValue;
                console.debug(`[Authorize.Net] Payment nonce created: ${token.substring(0, 20)}...`);
                resolve(token);
            });
        }
        catch (error) {
            if (error instanceof types_1.PaymentError) {
                reject(error);
                return;
            }
            reject(new types_1.PaymentError(types_1.PaymentErrorCode.TOKENIZATION_FAILED, "Failed to create Authorize.Net payment nonce", error));
        }
    });
}
/**
 * Reset Authorize.Net state
 */
function resetAuthorizeNet() {
    acceptJsReady = false;
    acceptJsReadyPromise = null;
    console.debug("[Authorize.Net] Reset complete");
}
/**
 * Check if Authorize.Net is ready
 */
function isAuthorizeNetReady() {
    return acceptJsReady && typeof window !== "undefined" && !!window.Accept;
}
