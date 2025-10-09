/**
 * Framework-Agnostic Payment Gateway Library
 *
 * Supports Stripe, Braintree, and Authorize.Net
 * Works with Next.js, Angular, React, and any JavaScript framework
 */
import { PaymentError, PaymentErrorCode } from "./types";
import { initializeStripe, createStripeToken, resetStripe, isStripeReady } from "./gateways/stripe";
import { initializeBraintree, createBraintreeToken, resetBraintree, isBraintreeReady } from "./gateways/braintree";
import { initializeAuthorizeNet, createAuthorizeNetToken, resetAuthorizeNet, isAuthorizeNetReady } from "./gateways/authorizenet";
import { Storage, STORAGE_KEY_GATEWAY } from "./utils";
import { logger } from "./utils/logger";
import { PaymentEventEmitter, PaymentEvent } from "./utils/events";
import { validateCard } from "./utils/card-validation";
import { withRetry } from "./utils/retry";
import { detectActiveGateway, determinePaymentScenario } from "./utils/gateway-detection";
import { createStripeSession, redirectToStripeCheckout, extractSessionIdFromUrl, isStripeSuccessUrl, isStripeCancelUrl } from "./utils/stripe-session";
/**
 * Payment Gateway Manager
 * Main class for managing payment gateway operations
 */
export class PaymentGatewayManager {
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
        this.storage = new Storage(adapter);
        this.events = new PaymentEventEmitter();
        this.autoDetectGateway = options?.autoDetectGateway ?? true;
        logger.info('Payment Gateway Manager initialized', {
            autoDetect: this.autoDetectGateway
        });
    }
    /**
     * Initialize gateway SDK
     */
    async initializeGatewaySDK(gatewayName) {
        if (this.readinessPromises[gatewayName]) {
            logger.debug(`Gateway ${gatewayName} already initializing`, {}, gatewayName);
            return this.readinessPromises[gatewayName];
        }
        const initPromise = (async () => {
            this.events.emitSync(PaymentEvent.GATEWAY_INITIALIZING, { gateway: gatewayName });
            logger.info(`Initializing ${gatewayName} SDK...`, {}, gatewayName);
            const initFn = async () => {
                switch (gatewayName) {
                    case "Stripe":
                        await initializeStripe(this.adapter);
                        break;
                    case "Braintree":
                        await initializeBraintree(this.adapter);
                        break;
                    case "Authorize.Net":
                        await initializeAuthorizeNet(this.adapter);
                        break;
                    default:
                        throw new PaymentError(PaymentErrorCode.NOT_SUPPORTED, `Unsupported gateway: ${gatewayName}`);
                }
            };
            try {
                if (this.enableRetry) {
                    await withRetry(initFn, this.retryOptions);
                }
                else {
                    await initFn();
                }
                logger.info(`${gatewayName} SDK ready`, {}, gatewayName);
                this.events.emitSync(PaymentEvent.GATEWAY_INITIALIZED, { gateway: gatewayName });
            }
            catch (error) {
                logger.error(`${gatewayName} SDK initialization failed`, error, gatewayName);
                this.events.emitSync(PaymentEvent.GATEWAY_FAILED, {
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
        this.storage.set(STORAGE_KEY_GATEWAY, gatewayName);
        logger.debug(`Active gateway set to: ${gatewayName}`, {}, gatewayName);
    }
    /**
     * Get active gateway
     */
    getActiveGateway() {
        const cached = this.storage.get(STORAGE_KEY_GATEWAY);
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
                logger.debug('Validating card details', { gateway: gatewayName }, gatewayName);
                const validation = validateCard(card);
                if (!validation.isValid) {
                    const errorMessage = validation.errors.join(', ');
                    logger.warn('Card validation failed', { errors: validation.errors }, gatewayName);
                    throw new PaymentError(PaymentErrorCode.VALIDATION_ERROR, `Card validation failed: ${errorMessage}`);
                }
                logger.debug('Card validation passed', { cardBrand: validation.cardBrand }, gatewayName);
            }
            // Ensure gateway is ready
            await this.ensureGatewayReady(gatewayName);
            // Emit tokenization started event
            this.events.emitSync(PaymentEvent.TOKENIZATION_STARTED, {
                gateway: gatewayName,
                cardBrand: this.validateCards ? validateCard(card).cardBrand : undefined
            });
            logger.info(`Creating payment token via ${gatewayName}...`, {}, gatewayName);
            let token;
            switch (gatewayName) {
                case "Stripe":
                    token = await createStripeToken(card, this.adapter);
                    break;
                case "Braintree":
                    token = await createBraintreeToken(card, this.adapter);
                    break;
                case "Authorize.Net":
                    token = await createAuthorizeNetToken(card, this.adapter);
                    break;
                default:
                    throw new PaymentError(PaymentErrorCode.NOT_SUPPORTED, `Unsupported gateway: ${gatewayName}`);
            }
            logger.info(`Payment token created successfully`, { hasToken: !!token }, gatewayName);
            // Emit tokenization success event
            this.events.emitSync(PaymentEvent.TOKENIZATION_SUCCESS, {
                gateway: gatewayName,
                token: token.substring(0, 10) + '...' // Only log first 10 chars
            });
            return {
                token,
                gatewayName
            };
        }
        catch (error) {
            logger.error(`Tokenization failed`, error, gatewayName);
            // Emit tokenization failed event
            this.events.emitSync(PaymentEvent.TOKENIZATION_FAILED, {
                gateway: gatewayName,
                error: error
            });
            if (error instanceof PaymentError) {
                throw error;
            }
            throw new PaymentError(PaymentErrorCode.TOKENIZATION_FAILED, "Failed to create payment method token", error);
        }
    }
    /**
     * Check if gateway is ready
     */
    isGatewayReady(gatewayName) {
        switch (gatewayName) {
            case "Stripe":
                return isStripeReady();
            case "Braintree":
                return isBraintreeReady();
            case "Authorize.Net":
                return isAuthorizeNetReady();
            default:
                return false;
        }
    }
    /**
     * Clear all payment context
     */
    async clearPaymentContext() {
        logger.info("Clearing payment context...");
        this.storage.remove(STORAGE_KEY_GATEWAY);
        resetStripe();
        resetBraintree();
        resetAuthorizeNet();
        for (const key in this.readinessPromises) {
            delete this.readinessPromises[key];
        }
        logger.info("Payment context cleared");
    }
    /**
     * Set log level
     */
    setLogLevel(level) {
        logger.setLevel(level);
    }
    /**
     * Get transaction logs
     */
    getLogs() {
        return logger.exportLogs();
    }
    /**
     * Get transaction stats
     */
    getStats() {
        return logger.getStats();
    }
    /**
     * Detect active payment gateway from backend
     * Should be called at application startup
     */
    async detectGateway() {
        logger.info('Detecting active payment gateway from backend...');
        try {
            const config = await detectActiveGateway(this.adapter);
            this.paymentConfig = config;
            // Auto-set active gateway
            this.setActiveGateway(config.gatewayName);
            logger.info('Gateway detection completed', {
                gateway: config.gatewayName,
                method: config.paymentMethod,
                scenario: config.scenario
            });
            // Emit detection success event
            this.events.emitSync(PaymentEvent.GATEWAY_INITIALIZED, {
                gateway: config.gatewayName,
                metadata: { scenario: config.scenario }
            });
            return config;
        }
        catch (error) {
            logger.error('Gateway detection failed', error);
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
        const config = determinePaymentScenario(response);
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
            throw new PaymentError(PaymentErrorCode.NOT_READY, 'Payment configuration not detected. Call detectGateway() first.');
        }
        if (this.paymentConfig.gatewayName !== 'Stripe') {
            throw new PaymentError(PaymentErrorCode.NOT_SUPPORTED, 'Current gateway is not Stripe');
        }
        logger.info('Creating Stripe checkout session...', {
            scenario: this.paymentConfig.scenario
        });
        const session = await createStripeSession(request, this.adapter);
        // If redirect is required, redirect automatically
        if (this.paymentConfig.requiresRedirect && session.url) {
            logger.info('Redirecting to Stripe checkout...');
            redirectToStripeCheckout(session.url);
        }
        return session;
    }
    /**
     * Extract session ID from URL after Stripe redirect
     * For scenario B: Stripe with redirect
     */
    extractStripeSessionId(url) {
        return extractSessionIdFromUrl(url);
    }
    /**
     * Check if current URL is Stripe success redirect
     */
    isStripeSuccessRedirect(url) {
        return isStripeSuccessUrl(url);
    }
    /**
     * Check if current URL is Stripe cancel redirect
     */
    isStripeCancelRedirect(url) {
        return isStripeCancelUrl(url);
    }
    /**
     * Get payment method token based on current scenario
     * This is the main method applications should use
     */
    async getPaymentMethodToken(input) {
        if (!this.paymentConfig) {
            throw new PaymentError(PaymentErrorCode.NOT_READY, 'Payment configuration not detected. Call detectGateway() first.');
        }
        const { scenario, gatewayName, tokenType } = this.paymentConfig;
        logger.info('Getting payment method token...', { scenario, tokenType });
        switch (scenario) {
            case 'stripe-session': {
                // Scenario A: Create Stripe session
                if (!input?.sessionRequest) {
                    throw new PaymentError(PaymentErrorCode.VALIDATION_ERROR, 'Session request is required for Stripe session scenario');
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
                    throw new PaymentError(PaymentErrorCode.TOKENIZATION_FAILED, 'Session ID not found in URL. User may not have completed Stripe checkout.');
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
                    throw new PaymentError(PaymentErrorCode.VALIDATION_ERROR, 'Card details are required for Braintree Edge Checkout');
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
                    throw new PaymentError(PaymentErrorCode.VALIDATION_ERROR, 'Card details are required for Authorize.Net Edge Checkout');
                }
                const result = await this.createPaymentToken(input.card, 'Authorize.Net');
                return {
                    token: result.token,
                    tokenType: 'rawCard',
                    gatewayName
                };
            }
            default:
                throw new PaymentError(PaymentErrorCode.NOT_SUPPORTED, `Unsupported payment scenario: ${scenario}`);
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
export { PaymentError, PaymentErrorCode } from "./types";
// Export all utilities
export * from "./utils/card-validation";
export * from "./utils/address-validation";
export * from "./utils/currency";
export * from "./utils/logger";
export * from "./utils/events";
export * from "./utils/retry";
export * from "./utils/three-d-secure";
export * from "./utils/card-icons";
export * from "./utils/gateway-detection";
export * from "./utils/stripe-session";
export * from "./test-utils";
// Default export for better bundler compatibility
export default PaymentGatewayManager;
