/**
 * Payment Gateway Type Definitions
 * Framework-agnostic types for payment processing
 */
/**
 * Payment Error Codes
 */
export var PaymentErrorCode;
(function (PaymentErrorCode) {
    PaymentErrorCode["DETECTION_FAILED"] = "DETECTION_FAILED";
    PaymentErrorCode["SDK_LOAD_FAILED"] = "SDK_LOAD_FAILED";
    PaymentErrorCode["INVALID_CARD"] = "INVALID_CARD";
    PaymentErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    PaymentErrorCode["TOKENIZATION_FAILED"] = "TOKENIZATION_FAILED";
    PaymentErrorCode["CLIENT_TOKEN_FAILED"] = "CLIENT_TOKEN_FAILED";
    PaymentErrorCode["NOT_SUPPORTED"] = "NOT_SUPPORTED";
    PaymentErrorCode["NOT_READY"] = "NOT_READY";
    PaymentErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    PaymentErrorCode["CONFIG_MISSING"] = "CONFIG_MISSING";
})(PaymentErrorCode || (PaymentErrorCode = {}));
export class PaymentError extends Error {
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = "PaymentError";
        console.debug(`[PaymentError] ${code}: ${message}`, details);
    }
}
