"use strict";
/**
 * Event System for Payment Lifecycle
 * Provides hooks for tracking payment operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentEvents = exports.EventBatcher = exports.PaymentEventEmitter = exports.PaymentEvent = void 0;
exports.createEventHandler = createEventHandler;
exports.filterByGateway = filterByGateway;
exports.filterByEventType = filterByEventType;
var PaymentEvent;
(function (PaymentEvent) {
    // Gateway lifecycle
    PaymentEvent["GATEWAY_INITIALIZING"] = "gateway_initializing";
    PaymentEvent["GATEWAY_INITIALIZED"] = "gateway_initialized";
    PaymentEvent["GATEWAY_FAILED"] = "gateway_failed";
    // Tokenization lifecycle
    PaymentEvent["TOKENIZATION_STARTED"] = "tokenization_started";
    PaymentEvent["TOKENIZATION_SUCCESS"] = "tokenization_success";
    PaymentEvent["TOKENIZATION_FAILED"] = "tokenization_failed";
    // Payment lifecycle
    PaymentEvent["PAYMENT_STARTED"] = "payment_started";
    PaymentEvent["PAYMENT_SUCCESS"] = "payment_success";
    PaymentEvent["PAYMENT_FAILED"] = "payment_failed";
    // Validation events
    PaymentEvent["VALIDATION_STARTED"] = "validation_started";
    PaymentEvent["VALIDATION_SUCCESS"] = "validation_success";
    PaymentEvent["VALIDATION_FAILED"] = "validation_failed";
    // SDK events
    PaymentEvent["SDK_LOADING"] = "sdk_loading";
    PaymentEvent["SDK_LOADED"] = "sdk_loaded";
    PaymentEvent["SDK_LOAD_FAILED"] = "sdk_load_failed";
    // General events
    PaymentEvent["ERROR_OCCURRED"] = "error_occurred";
    PaymentEvent["WARNING_OCCURRED"] = "warning_occurred";
})(PaymentEvent || (exports.PaymentEvent = PaymentEvent = {}));
/**
 * Payment Event Emitter
 * Manages event listeners and emits events
 */
class PaymentEventEmitter {
    constructor() {
        this.listeners = new Map();
        this.globalListeners = [];
    }
    /**
     * Subscribe to a specific event
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        // Return unsubscribe function
        return () => this.off(event, callback);
    }
    /**
     * Subscribe to a specific event (one-time only)
     */
    once(event, callback) {
        const wrappedCallback = async (data) => {
            await callback(data);
            this.off(event, wrappedCallback);
        };
        return this.on(event, wrappedCallback);
    }
    /**
     * Subscribe to all events
     */
    onAny(callback) {
        this.globalListeners.push(callback);
        // Return unsubscribe function
        return () => this.offAny(callback);
    }
    /**
     * Unsubscribe from a specific event
     */
    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    /**
     * Unsubscribe from all events
     */
    offAny(callback) {
        const index = this.globalListeners.indexOf(callback);
        if (index > -1) {
            this.globalListeners.splice(index, 1);
        }
    }
    /**
     * Emit an event
     */
    async emit(event, data = {}) {
        const eventData = {
            event,
            timestamp: new Date(),
            ...data
        };
        // Call specific event listeners
        const callbacks = this.listeners.get(event) || [];
        for (const callback of callbacks) {
            try {
                await callback(eventData);
            }
            catch (error) {
                console.error(`[PaymentEvents] Error in event listener for ${event}:`, error);
            }
        }
        // Call global listeners
        for (const callback of this.globalListeners) {
            try {
                await callback(eventData);
            }
            catch (error) {
                console.error(`[PaymentEvents] Error in global event listener:`, error);
            }
        }
    }
    /**
     * Emit an event synchronously (fire and forget)
     */
    emitSync(event, data = {}) {
        this.emit(event, data).catch(error => {
            console.error(`[PaymentEvents] Error emitting event ${event}:`, error);
        });
    }
    /**
     * Remove all listeners
     */
    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
        }
        else {
            this.listeners.clear();
            this.globalListeners = [];
        }
    }
    /**
     * Get listener count for an event
     */
    listenerCount(event) {
        return (this.listeners.get(event) || []).length;
    }
    /**
     * Get all registered events
     */
    eventNames() {
        return Array.from(this.listeners.keys());
    }
}
exports.PaymentEventEmitter = PaymentEventEmitter;
/**
 * Helper to create typed event handlers
 */
function createEventHandler(callback) {
    return async (eventData) => {
        await callback(eventData.data, eventData);
    };
}
/**
 * Helper to filter events by gateway
 */
function filterByGateway(gateway, callback) {
    return async (eventData) => {
        if (eventData.gateway === gateway) {
            await callback(eventData);
        }
    };
}
/**
 * Helper to filter events by type
 */
function filterByEventType(events, callback) {
    return async (eventData) => {
        if (events.includes(eventData.event)) {
            await callback(eventData);
        }
    };
}
/**
 * Helper to batch events
 */
class EventBatcher {
    constructor(callback, batchDelayMs = 1000) {
        this.callback = callback;
        this.batchDelayMs = batchDelayMs;
        this.batchedEvents = [];
        this.timer = null;
    }
    add(eventData) {
        this.batchedEvents.push(eventData);
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this.flush();
        }, this.batchDelayMs);
    }
    async flush() {
        if (this.batchedEvents.length === 0) {
            return;
        }
        const events = [...this.batchedEvents];
        this.batchedEvents = [];
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        await this.callback(events);
    }
}
exports.EventBatcher = EventBatcher;
/**
 * Global event emitter instance
 */
exports.paymentEvents = new PaymentEventEmitter();
