/**
 * Authorize.Net Payment Gateway Integration
 * Framework-agnostic implementation
 */
import { CardInput, EnvironmentAdapter } from "../types";
/**
 * Initialize Authorize.Net Accept.js SDK
 */
export declare function initializeAuthorizeNet(adapter: EnvironmentAdapter): Promise<void>;
/**
 * Create payment nonce from card details
 */
export declare function createAuthorizeNetToken(card: CardInput, adapter: EnvironmentAdapter): Promise<string>;
/**
 * Reset Authorize.Net state
 */
export declare function resetAuthorizeNet(): void;
/**
 * Check if Authorize.Net is ready
 */
export declare function isAuthorizeNetReady(): boolean;
//# sourceMappingURL=authorizenet.d.ts.map