/**
 * Retry Logic with Exponential Backoff
 * Provides automatic retry for transient failures
 */
import { PaymentErrorCode } from '../types';
export interface RetryOptions {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    maxDelayMs?: number;
    retryableErrors?: PaymentErrorCode[];
    onRetry?: (attempt: number, error: any) => void;
}
/**
 * Execute a function with automatic retry on failure
 */
export declare function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Retry with timeout
 */
export declare function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number, timeoutMessage?: string): Promise<T>;
/**
 * Retry with both timeout and exponential backoff
 */
export declare function withRetryAndTimeout<T>(fn: () => Promise<T>, retryOptions?: RetryOptions, timeoutMs?: number): Promise<T>;
//# sourceMappingURL=retry.d.ts.map