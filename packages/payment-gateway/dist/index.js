"use strict";
/**
 * Framework-Agnostic Payment Gateway Library
 *
 * Supports Stripe, Braintree, and Authorize.Net
 * Works with Next.js, Angular, React, and any JavaScript framework
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentErrorCode = exports.PaymentError = exports.PaymentGatewayManager = void 0;
const types_1 = require("./types");
const stripe_1 = require("./gateways/stripe");
const braintree_1 = require("./gateways/braintree");
const authorizenet_1 = require("./gateways/authorizenet");
const utils_1 = require("./utils");
const logger_1 = require("./utils/logger");
const events_1 = require("./utils/events");
const card_validation_1 = require("./utils/card-validation");
const retry_1 = require("./utils/retry");
const gateway_detection_1 = require("./utils/gateway-detection");
const stripe_session_1 = require("./utils/stripe-session");
/**
 * Payment Gateway Manager
 * Main class for managing payment gateway operations
 */
class PaymentGatewayManager {
    constructor(adapter, options) {
        this.readinessPromises = {};
        this.paymentConfig = null;
        /**
         * Enable/disable card validation
         */
        this.validateCards = true;
        /**
         * Enable/disable retry logic
         */
        this.enableRetry = true;
        /**
         * Retry options
         */
        this.retryOptions = {
            maxAttempts: 3,
            delayMs: 1000,
            backoffMultiplier: 2
        };
        /**
         * Auto-detect gateway on initialization
         */
        this.autoDetectGateway = true;
        this.adapter = adapter;
        this.storage = new utils_1.Storage(adapter);
        this.events = new events_1.PaymentEventEmitter();
        this.autoDetectGateway = options?.autoDetectGateway ?? true;
        logger_1.logger.info('Payment Gateway Manager initialized', {
            autoDetect: this.autoDetectGateway
        });
    }
    /**
     * Initialize gateway SDK
     */
    async initializeGatewaySDK(gatewayName) {
        if (this.readinessPromises[gatewayName]) {
            logger_1.logger.debug(`Gateway ${gatewayName} already initializing`, {}, gatewayName);
            return this.readinessPromises[gatewayName];
        }
        const initPromise = (async () => {
            this.events.emitSync(events_1.PaymentEvent.GATEWAY_INITIALIZING, { gateway: gatewayName });
            logger_1.logger.info(`Initializing ${gatewayName} SDK...`, {}, gatewayName);
            const initFn = async () => {
                switch (gatewayName) {
                    case "Stripe":
                        await (0, stripe_1.initializeStripe)(this.adapter);
                        break;
                    case "Braintree":
                        await (0, braintree_1.initializeBraintree)(this.adapter);
                        break;
                    case "Authorize.Net":
                        await (0, authorizenet_1.initializeAuthorizeNet)(this.adapter);
                        break;
                    default:
                        throw new types_1.PaymentError(types_1.PaymentErrorCode.NOT_SUPPORTED, `Unsupported gateway: ${gatewayName}`);
                }
            };
            try {
                if (this.enableRetry) {
                    await (0, retry_1.withRetry)(initFn, this.retryOptions);
                }
                else {
                    await initFn();
                }
                logger_1.logger.info(`${gatewayName} SDK ready`, {}, gatewayName);
                this.events.emitSync(events_1.PaymentEvent.GATEWAY_INITIALIZED, { gateway: gatewayName });
            }
            catch (error) {
                logger_1.logger.error(`${gatewayName} SDK initialization failed`, error, gatewayName);
                this.events.emitSync(events_1.PaymentEvent.GATEWAY_FAILED, {
                    gateway: gatewayName,
                    error: error
                });
                throw error;
            }
        })();
        this.readinessPromises[gatewayName] = initPromise;
        return initPromise;
    }
    /**
     * Set active gateway
     */
    setActiveGateway(gatewayName) {
        this.storage.set(utils_1.STORAGE_KEY_GATEWAY, gatewayName);
        logger_1.logger.debug(`Active gateway set to: ${gatewayName}`, {}, gatewayName);
    }
    /**
     * Get active gateway
     */
    getActiveGateway() {
        const cached = this.storage.get(utils_1.STORAGE_KEY_GATEWAY);
        return cached;
    }
    /**
     * Ensure gateway is ready
     */
    async ensureGatewayReady(gatewayName) {
        await this.initializeGatewaySDK(gatewayName);
        return {
            ready: true,
            gatewayName
        };
    }
    /**
     * Create payment token from card details
     */
    async createPaymentToken(card, gatewayName) {
        try {
            // Validate card if enabled
            if (this.validateCards) {
                logger_1.logger.debug('Validating card details', { gateway: gatewayName }, gatewayName);
                const validation = (0, card_validation_1.validateCard)(card);
                if (!validation.isValid) {
                    const errorMessage = validation.errors.join(', ');
                    logger_1.logger.warn('Card validation failed', { errors: validation.errors }, gatewayName);
                    throw new types_1.PaymentError(types_1.PaymentErrorCode.VALIDATION_ERROR, `Card validation failed: ${errorMessage}`);
                }
                logger_1.logger.debug('Card validation passed', { cardBrand: validation.cardBrand }, gatewayName);
            }
            // Ensure gateway is ready
            await this.ensureGatewayReady(gatewayName);
            // Emit tokenization started event
            this.events.emitSync(events_1.PaymentEvent.TOKENIZATION_STARTED, {
                gateway: gatewayName,
                cardBrand: this.validateCards ? (0, card_validation_1.validateCard)(card).cardBrand : undefined
            });
            logger_1.logger.info(`Creating payment token via ${gatewayName}...`, {}, gatewayName);
            let token;
            switch (gatewayName) {
                case "Stripe":
                    token = await (0, stripe_1.createStripeToken)(card, this.adapter);
                    break;
                case "Braintree":
                    token = await (0, braintree_1.createBraintreeToken)(card, this.adapter);
                    break;
                case "Authorize.Net":
                    token = await (0, authorizenet_1.createAuthorizeNetToken)(card, this.adapter);
                    break;
                default:
                    throw new types_1.PaymentError(types_1.PaymentErrorCode.NOT_SUPPORTED, `Unsupported gateway: ${gatewayName}`);
            }
            logger_1.logger.info(`Payment token created successfully`, { hasToken: !!token }, gatewayName);
            // Emit tokenization success event
            this.events.emitSync(events_1.PaymentEvent.TOKENIZATION_SUCCESS, {
                gateway: gatewayName,
                token: token.substring(0, 10) + '...' // Only log first 10 chars
            });
            return {
                token,
                gatewayName
            };
        }
        catch (error) {
            logger_1.logger.error(`Tokenization failed`, error, gatewayName);
            // Emit tokenization failed event
            this.events.emitSync(events_1.PaymentEvent.TOKENIZATION_FAILED, {
                gateway: gatewayName,
                error: error
            });
            if (error instanceof types_1.PaymentError) {
                throw error;
            }
            throw new types_1.PaymentError(types_1.PaymentErrorCode.TOKENIZATION_FAILED, "Failed to create payment method token", error);
        }
    }
    /**
     * Check if gateway is ready
     */
    isGatewayReady(gatewayName) {
        switch (gatewayName) {
            case "Stripe":
                return (0, stripe_1.isStripeReady)();
            case "Braintree":
                return (0, braintree_1.isBraintreeReady)();
            case "Authorize.Net":
                return (0, authorizenet_1.isAuthorizeNetReady)();
            default:
                return false;
        }
    }
    /**
     * Clear all payment context
     */
    async clearPaymentContext() {
        logger_1.logger.info("Clearing payment context...");
        this.storage.remove(utils_1.STORAGE_KEY_GATEWAY);
        (0, stripe_1.resetStripe)();
        (0, braintree_1.resetBraintree)();
        (0, authorizenet_1.resetAuthorizeNet)();
        for (const key in this.readinessPromises) {
            delete this.readinessPromises[key];
        }
        logger_1.logger.info("Payment context cleared");
    }
    /**
     * Set log level
     */
    setLogLevel(level) {
        logger_1.logger.setLevel(level);
    }
    /**
     * Get transaction logs
     */
    getLogs() {
        return logger_1.logger.exportLogs();
    }
    /**
     * Get transaction stats
     */
    getStats() {
        return logger_1.logger.getStats();
    }
    /**
     * Detect active payment gateway from backend
     * Should be called at application startup
     */
    async detectGateway() {
        logger_1.logger.info('Detecting active payment gateway from backend...');
        try {
            const config = await (0, gateway_detection_1.detectActiveGateway)(this.adapter);
            this.paymentConfig = config;
            // Auto-set active gateway
            this.setActiveGateway(config.gatewayName);
            logger_1.logger.info('Gateway detection completed', {
                gateway: config.gatewayName,
                method: config.paymentMethod,
                scenario: config.scenario
            });
            // Emit detection success event
            this.events.emitSync(events_1.PaymentEvent.GATEWAY_INITIALIZED, {
                gateway: config.gatewayName,
                metadata: { scenario: config.scenario }
            });
            return config;
        }
        catch (error) {
            logger_1.logger.error('Gateway detection failed', error);
            throw error;
        }
    }
    /**
     * Get current payment configuration
     */
    getPaymentConfiguration() {
        return this.paymentConfig;
    }
    /**
     * Manually set payment configuration (alternative to detectGateway)
     */
    setPaymentConfiguration(response) {
        const config = (0, gateway_detection_1.determinePaymentScenario)(response);
        this.paymentConfig = config;
        this.setActiveGateway(config.gatewayName);
        return config;
    }
    /**
     * Create Stripe checkout session
     * For scenario A: Stripe with session-based checkout
     */
    async createStripeCheckoutSession(request) {
        if (!this.paymentConfig) {
            throw new types_1.PaymentError(types_1.PaymentErrorCode.NOT_READY, 'Payment configuration not detected. Call detectGateway() first.');
        }
        if (this.paymentConfig.gatewayName !== 'Stripe') {
            throw new types_1.PaymentError(types_1.PaymentErrorCode.NOT_SUPPORTED, 'Current gateway is not Stripe');
        }
        logger_1.logger.info('Creating Stripe checkout session...', {
            scenario: this.paymentConfig.scenario
        });
        const session = await (0, stripe_session_1.createStripeSession)(request, this.adapter);
        // If redirect is required, redirect automatically
        if (this.paymentConfig.requiresRedirect && session.url) {
            logger_1.logger.info('Redirecting to Stripe checkout...');
            (0, stripe_session_1.redirectToStripeCheckout)(session.url);
        }
        return session;
    }
    /**
     * Extract session ID from URL after Stripe redirect
     * For scenario B: Stripe with redirect
     */
    extractStripeSessionId(url) {
        return (0, stripe_session_1.extractSessionIdFromUrl)(url);
    }
    /**
     * Check if current URL is Stripe success redirect
     */
    isStripeSuccessRedirect(url) {
        return (0, stripe_session_1.isStripeSuccessUrl)(url);
    }
    /**
     * Check if current URL is Stripe cancel redirect
     */
    isStripeCancelRedirect(url) {
        return (0, stripe_session_1.isStripeCancelUrl)(url);
    }
    /**
     * Get payment method token based on current scenario
     * This is the main method applications should use
     */
    async getPaymentMethodToken(input) {
        if (!this.paymentConfig) {
            throw new types_1.PaymentError(types_1.PaymentErrorCode.NOT_READY, 'Payment configuration not detected. Call detectGateway() first.');
        }
        const { scenario, gatewayName, tokenType } = this.paymentConfig;
        logger_1.logger.info('Getting payment method token...', { scenario, tokenType });
        switch (scenario) {
            case 'stripe-session': {
                // Scenario A: Create Stripe session
                if (!input?.sessionRequest) {
                    throw new types_1.PaymentError(types_1.PaymentErrorCode.VALIDATION_ERROR, 'Session request is required for Stripe session scenario');
                }
                const session = await this.createStripeCheckoutSession(input.sessionRequest);
                return {
                    token: session.sessionId,
                    tokenType: 'sessionId',
                    gatewayName
                };
            }
            case 'stripe-redirect': {
                // Scenario B: Extract session ID from URL after redirect
                const sessionId = this.extractStripeSessionId();
                if (!sessionId) {
                    throw new types_1.PaymentError(types_1.PaymentErrorCode.TOKENIZATION_FAILED, 'Session ID not found in URL. User may not have completed Stripe checkout.');
                }
                return {
                    token: sessionId,
                    tokenType: 'sessionId',
                    gatewayName
                };
            }
            case 'braintree-edge': {
                // Scenario C: Create Braintree nonce
                if (!input?.card) {
                    throw new types_1.PaymentError(types_1.PaymentErrorCode.VALIDATION_ERROR, 'Card details are required for Braintree Edge Checkout');
                }
                const result = await this.createPaymentToken(input.card, 'Braintree');
                return {
                    token: result.token,
                    tokenType: 'nonce',
                    gatewayName
                };
            }
            case 'authorizenet-edge': {
                // Scenario D: Return raw card or create token
                if (!input?.card) {
                    throw new types_1.PaymentError(types_1.PaymentErrorCode.VALIDATION_ERROR, 'Card details are required for Authorize.Net Edge Checkout');
                }
                const result = await this.createPaymentToken(input.card, 'Authorize.Net');
                return {
                    token: result.token,
                    tokenType: 'rawCard',
                    gatewayName
                };
            }
            default:
                throw new types_1.PaymentError(types_1.PaymentErrorCode.NOT_SUPPORTED, `Unsupported payment scenario: ${scenario}`);
        }
    }
    /**
     * Check if Edge Checkout UI is required
     */
    requiresEdgeCheckout() {
        if (!this.paymentConfig) {
            return false;
        }
        return this.paymentConfig.paymentMethod === 'Edge Checkout';
    }
    /**
     * Check if Stripe redirect is required
     */
    requiresStripeRedirect() {
        if (!this.paymentConfig) {
            return false;
        }
        return this.paymentConfig.scenario === 'stripe-redirect';
    }
}
exports.PaymentGatewayManager = PaymentGatewayManager;
var types_2 = require("./types");
Object.defineProperty(exports, "PaymentError", { enumerable: true, get: function () { return types_2.PaymentError; } });
Object.defineProperty(exports, "PaymentErrorCode", { enumerable: true, get: function () { return types_2.PaymentErrorCode; } });
// Export all utilities
__exportStar(require("./utils/card-validation"), exports);
__exportStar(require("./utils/address-validation"), exports);
__exportStar(require("./utils/currency"), exports);
__exportStar(require("./utils/logger"), exports);
__exportStar(require("./utils/events"), exports);
__exportStar(require("./utils/retry"), exports);
__exportStar(require("./utils/three-d-secure"), exports);
__exportStar(require("./utils/card-icons"), exports);
__exportStar(require("./utils/gateway-detection"), exports);
__exportStar(require("./utils/stripe-session"), exports);
__exportStar(require("./test-utils"), exports);
