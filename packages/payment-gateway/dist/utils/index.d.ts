/**
 * Framework-agnostic utility functions
 */
import { EnvironmentAdapter } from "../types";
/**
 * Dynamically load an external JavaScript file
 *
 * @param src - The script URL to load
 * @param adapter - Environment adapter for browser check
 * @returns Promise that resolves when script is loaded
 */
export declare function loadScript(src: string, adapter: EnvironmentAdapter): Promise<void>;
/**
 * Storage abstraction for framework-agnostic usage
 */
export declare class Storage {
    private adapter;
    constructor(adapter: EnvironmentAdapter);
    get(key: string): string | null;
    set(key: string, value: string): void;
    remove(key: string): void;
}
/**
 * Storage keys
 */
export declare const STORAGE_KEY_GATEWAY = "payment.activeGateway";
export declare const STORAGE_KEY_PAYMENT_THROUGH = "payment.paymentThrough";
/**
 * Normalize gateway name from API response
 */
export declare function normalizeGatewayName(name: string): string;
/**
 * Wait for a condition with timeout
 */
export declare function waitFor(condition: () => boolean, timeout?: number, interval?: number): Promise<void>;
//# sourceMappingURL=index.d.ts.map