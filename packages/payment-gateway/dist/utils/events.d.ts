/**
 * Event System for Payment Lifecycle
 * Provides hooks for tracking payment operations
 */
import { GatewayName } from '../types';
export declare enum PaymentEvent {
    GATEWAY_INITIALIZING = "gateway_initializing",
    GATEWAY_INITIALIZED = "gateway_initialized",
    GATEWAY_FAILED = "gateway_failed",
    TOKENIZATION_STARTED = "tokenization_started",
    TOKENIZATION_SUCCESS = "tokenization_success",
    TOKENIZATION_FAILED = "tokenization_failed",
    PAYMENT_STARTED = "payment_started",
    PAYMENT_SUCCESS = "payment_success",
    PAYMENT_FAILED = "payment_failed",
    VALIDATION_STARTED = "validation_started",
    VALIDATION_SUCCESS = "validation_success",
    VALIDATION_FAILED = "validation_failed",
    SDK_LOADING = "sdk_loading",
    SDK_LOADED = "sdk_loaded",
    SDK_LOAD_FAILED = "sdk_load_failed",
    ERROR_OCCURRED = "error_occurred",
    WARNING_OCCURRED = "warning_occurred"
}
export interface PaymentEventData {
    event: PaymentEvent;
    timestamp: Date;
    gateway?: GatewayName;
    data?: any;
    error?: Error;
    metadata?: Record<string, any>;
    cardBrand?: string;
    token?: string;
}
export type EventCallback = (data: PaymentEventData) => void | Promise<void>;
/**
 * Payment Event Emitter
 * Manages event listeners and emits events
 */
export declare class PaymentEventEmitter {
    private listeners;
    private globalListeners;
    /**
     * Subscribe to a specific event
     */
    on(event: PaymentEvent, callback: EventCallback): () => void;
    /**
     * Subscribe to a specific event (one-time only)
     */
    once(event: PaymentEvent, callback: EventCallback): () => void;
    /**
     * Subscribe to all events
     */
    onAny(callback: EventCallback): () => void;
    /**
     * Unsubscribe from a specific event
     */
    off(event: PaymentEvent, callback: EventCallback): void;
    /**
     * Unsubscribe from all events
     */
    offAny(callback: EventCallback): void;
    /**
     * Emit an event
     */
    emit(event: PaymentEvent, data?: Partial<Omit<PaymentEventData, 'event' | 'timestamp'>>): Promise<void>;
    /**
     * Emit an event synchronously (fire and forget)
     */
    emitSync(event: PaymentEvent, data?: Partial<Omit<PaymentEventData, 'event' | 'timestamp'>>): void;
    /**
     * Remove all listeners
     */
    removeAllListeners(event?: PaymentEvent): void;
    /**
     * Get listener count for an event
     */
    listenerCount(event: PaymentEvent): number;
    /**
     * Get all registered events
     */
    eventNames(): PaymentEvent[];
}
/**
 * Helper to create typed event handlers
 */
export declare function createEventHandler<T = any>(callback: (data: T, eventData: PaymentEventData) => void | Promise<void>): EventCallback;
/**
 * Helper to filter events by gateway
 */
export declare function filterByGateway(gateway: GatewayName, callback: EventCallback): EventCallback;
/**
 * Helper to filter events by type
 */
export declare function filterByEventType(events: PaymentEvent[], callback: EventCallback): EventCallback;
/**
 * Helper to batch events
 */
export declare class EventBatcher {
    private callback;
    private batchDelayMs;
    private batchedEvents;
    private timer;
    constructor(callback: (events: PaymentEventData[]) => void | Promise<void>, batchDelayMs?: number);
    add(eventData: PaymentEventData): void;
    flush(): Promise<void>;
}
/**
 * Global event emitter instance
 */
export declare const paymentEvents: PaymentEventEmitter;
//# sourceMappingURL=events.d.ts.map