/**
 * Event System for Payment Lifecycle
 * Provides hooks for tracking payment operations
 */

import { GatewayName } from '../types';

export enum PaymentEvent {
  // Gateway lifecycle
  GATEWAY_INITIALIZING = 'gateway_initializing',
  GATEWAY_INITIALIZED = 'gateway_initialized',
  GATEWAY_FAILED = 'gateway_failed',

  // Tokenization lifecycle
  TOKENIZATION_STARTED = 'tokenization_started',
  TOKENIZATION_SUCCESS = 'tokenization_success',
  TOKENIZATION_FAILED = 'tokenization_failed',

  // Payment lifecycle
  PAYMENT_STARTED = 'payment_started',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',

  // Validation events
  VALIDATION_STARTED = 'validation_started',
  VALIDATION_SUCCESS = 'validation_success',
  VALIDATION_FAILED = 'validation_failed',

  // SDK events
  SDK_LOADING = 'sdk_loading',
  SDK_LOADED = 'sdk_loaded',
  SDK_LOAD_FAILED = 'sdk_load_failed',

  // General events
  ERROR_OCCURRED = 'error_occurred',
  WARNING_OCCURRED = 'warning_occurred'
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
export class PaymentEventEmitter {
  private listeners: Map<PaymentEvent, EventCallback[]> = new Map();
  private globalListeners: EventCallback[] = [];

  /**
   * Subscribe to a specific event
   */
  on(event: PaymentEvent, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to a specific event (one-time only)
   */
  once(event: PaymentEvent, callback: EventCallback): () => void {
    const wrappedCallback: EventCallback = async (data) => {
      await callback(data);
      this.off(event, wrappedCallback);
    };

    return this.on(event, wrappedCallback);
  }

  /**
   * Subscribe to all events
   */
  onAny(callback: EventCallback): () => void {
    this.globalListeners.push(callback);

    // Return unsubscribe function
    return () => this.offAny(callback);
  }

  /**
   * Unsubscribe from a specific event
   */
  off(event: PaymentEvent, callback: EventCallback): void {
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
  offAny(callback: EventCallback): void {
    const index = this.globalListeners.indexOf(callback);
    if (index > -1) {
      this.globalListeners.splice(index, 1);
    }
  }

  /**
   * Emit an event
   */
  async emit(
    event: PaymentEvent,
    data: Partial<Omit<PaymentEventData, 'event' | 'timestamp'>> = {}
  ): Promise<void> {
    const eventData: PaymentEventData = {
      event,
      timestamp: new Date(),
      ...data
    };

    // Call specific event listeners
    const callbacks = this.listeners.get(event) || [];
    for (const callback of callbacks) {
      try {
        await callback(eventData);
      } catch (error) {
        console.error(`[PaymentEvents] Error in event listener for ${event}:`, error);
      }
    }

    // Call global listeners
    for (const callback of this.globalListeners) {
      try {
        await callback(eventData);
      } catch (error) {
        console.error(`[PaymentEvents] Error in global event listener:`, error);
      }
    }
  }

  /**
   * Emit an event synchronously (fire and forget)
   */
  emitSync(
    event: PaymentEvent,
    data: Partial<Omit<PaymentEventData, 'event' | 'timestamp'>> = {}
  ): void {
    this.emit(event, data).catch(error => {
      console.error(`[PaymentEvents] Error emitting event ${event}:`, error);
    });
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(event?: PaymentEvent): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
      this.globalListeners = [];
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: PaymentEvent): number {
    return (this.listeners.get(event) || []).length;
  }

  /**
   * Get all registered events
   */
  eventNames(): PaymentEvent[] {
    return Array.from(this.listeners.keys());
  }
}

/**
 * Helper to create typed event handlers
 */
export function createEventHandler<T = any>(
  callback: (data: T, eventData: PaymentEventData) => void | Promise<void>
): EventCallback {
  return async (eventData: PaymentEventData) => {
    await callback(eventData.data as T, eventData);
  };
}

/**
 * Helper to filter events by gateway
 */
export function filterByGateway(gateway: GatewayName, callback: EventCallback): EventCallback {
  return async (eventData: PaymentEventData) => {
    if (eventData.gateway === gateway) {
      await callback(eventData);
    }
  };
}

/**
 * Helper to filter events by type
 */
export function filterByEventType(events: PaymentEvent[], callback: EventCallback): EventCallback {
  return async (eventData: PaymentEventData) => {
    if (events.includes(eventData.event)) {
      await callback(eventData);
    }
  };
}

/**
 * Helper to batch events
 */
export class EventBatcher {
  private batchedEvents: PaymentEventData[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private callback: (events: PaymentEventData[]) => void | Promise<void>,
    private batchDelayMs = 1000
  ) {}

  add(eventData: PaymentEventData): void {
    this.batchedEvents.push(eventData);

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.flush();
    }, this.batchDelayMs);
  }

  async flush(): Promise<void> {
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

/**
 * Global event emitter instance
 */
export const paymentEvents = new PaymentEventEmitter();
