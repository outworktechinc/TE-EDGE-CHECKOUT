/**
 * Retry Logic with Exponential Backoff
 * Provides automatic retry for transient failures
 */

import { PaymentError, PaymentErrorCode } from '../types';

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
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 10000,
    retryableErrors = [
      PaymentErrorCode.NETWORK_ERROR,
      PaymentErrorCode.SDK_LOAD_FAILED
    ],
    onRetry
  } = options;

  let lastError: any;
  let delay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const isRetryable = shouldRetry(error, retryableErrors);

      if (!isRetryable) {
        console.debug(`[Retry] Error is not retryable, throwing immediately`);
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        console.debug(`[Retry] Max attempts (${maxAttempts}) reached, throwing error`);
        break;
      }

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, error);
      }

      console.debug(
        `[Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`,
        error instanceof Error ? error.message : error
      );

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Check if an error should be retried
 */
function shouldRetry(error: any, retryableErrors: PaymentErrorCode[]): boolean {
  // PaymentError with retryable error code
  if (error instanceof PaymentError) {
    return retryableErrors.includes(error.code);
  }

  // Network errors (fetch failures, timeouts, etc.)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // Script load errors
  if (error instanceof Error && error.message.includes('script')) {
    return true;
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new PaymentError(
        PaymentErrorCode.NETWORK_ERROR,
        timeoutMessage
      )), timeoutMs)
    )
  ]);
}

/**
 * Retry with both timeout and exponential backoff
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  retryOptions: RetryOptions = {},
  timeoutMs = 30000
): Promise<T> {
  return withRetry(
    () => withTimeout(fn, timeoutMs),
    retryOptions
  );
}
