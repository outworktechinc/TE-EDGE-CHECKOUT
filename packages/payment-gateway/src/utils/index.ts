/**
 * Framework-agnostic utility functions
 */

import { PaymentError, PaymentErrorCode, EnvironmentAdapter } from "../types";

/**
 * Track loaded scripts to avoid duplicate loads
 */
const loadedScripts = new Set<string>();
const loadingScripts = new Map<string, Promise<void>>();

/**
 * Dynamically load an external JavaScript file
 *
 * @param src - The script URL to load
 * @param adapter - Environment adapter for browser check
 * @returns Promise that resolves when script is loaded
 */
export function loadScript(src: string, adapter: EnvironmentAdapter): Promise<void> {
  if (!adapter.isBrowser()) {
    return Promise.reject(
      new PaymentError(
        PaymentErrorCode.SDK_LOAD_FAILED,
        "Cannot load scripts in server environment"
      )
    );
  }

  if (loadedScripts.has(src)) {
    console.debug(`[loadScript] Already loaded: ${src}`);
    return Promise.resolve();
  }

  if (loadingScripts.has(src)) {
    console.debug(`[loadScript] Already loading: ${src}`);
    return loadingScripts.get(src)!;
  }

  console.debug(`[loadScript] Loading: ${src}`);

  const loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;

    script.onload = () => {
      console.debug(`[loadScript] Loaded successfully: ${src}`);
      loadedScripts.add(src);
      loadingScripts.delete(src);
      resolve();
    };

    script.onerror = () => {
      loadingScripts.delete(src);
      reject(
        new PaymentError(
          PaymentErrorCode.SDK_LOAD_FAILED,
          `Failed to load script: ${src}`
        )
      );
    };

    document.head.appendChild(script);
  });

  loadingScripts.set(src, loadPromise);
  return loadPromise;
}

/**
 * Storage abstraction for framework-agnostic usage
 */
export class Storage {
  private adapter: EnvironmentAdapter;

  constructor(adapter: EnvironmentAdapter) {
    this.adapter = adapter;
  }

  get(key: string): string | null {
    if (!this.adapter.isBrowser()) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.debug(`[storage] Failed to read ${key}:`, e);
      return null;
    }
  }

  set(key: string, value: string): void {
    if (!this.adapter.isBrowser()) return;
    try {
      localStorage.setItem(key, value);
      console.debug(`[storage] Set ${key} = ${value}`);
    } catch (e) {
      console.debug(`[storage] Failed to write ${key}:`, e);
    }
  }

  remove(key: string): void {
    if (!this.adapter.isBrowser()) return;
    try {
      localStorage.removeItem(key);
      console.debug(`[storage] Removed ${key}`);
    } catch (e) {
      console.debug(`[storage] Failed to remove ${key}:`, e);
    }
  }
}

/**
 * Storage keys
 */
export const STORAGE_KEY_GATEWAY = "payment.activeGateway";
export const STORAGE_KEY_PAYMENT_THROUGH = "payment.paymentThrough";

/**
 * Normalize gateway name from API response
 */
export function normalizeGatewayName(name: string): string {
  const normalized = name.trim();
  const lowerName = normalized.toLowerCase();

  if (lowerName === "stripe") return "Stripe";
  if (lowerName === "braintree") return "Braintree";
  if (lowerName === "authorize.net" || lowerName === "authorizenet" || lowerName === "authorizedotnet") {
    return "Authorize.Net";
  }

  return normalized;
}

/**
 * Wait for a condition with timeout
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 10000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new PaymentError(
        PaymentErrorCode.SDK_LOAD_FAILED,
        "Timeout waiting for condition"
      );
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}
