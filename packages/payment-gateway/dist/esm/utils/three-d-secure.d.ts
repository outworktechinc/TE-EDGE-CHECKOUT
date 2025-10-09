/**
 * 3D Secure (SCA) Support
 * Handles Strong Customer Authentication for payments
 */
import { EnvironmentAdapter } from '../types';
export declare enum ThreeDSStatus {
    NOT_REQUIRED = "not_required",
    REQUIRES_ACTION = "requires_action",
    SUCCEEDED = "succeeded",
    FAILED = "failed",
    PENDING = "pending"
}
export interface ThreeDSResult {
    status: ThreeDSStatus;
    requiresAction: boolean;
    clientSecret?: string;
    redirectUrl?: string;
    error?: string;
}
export interface ThreeDSOptions {
    returnUrl?: string;
    challengeWindowSize?: '01' | '02' | '03' | '04' | '05';
}
/**
 * Handle Stripe 3D Secure authentication
 */
export declare function handleStripe3DS(paymentIntentClientSecret: string, stripe: any, _options?: ThreeDSOptions): Promise<ThreeDSResult>;
/**
 * Handle Braintree 3D Secure authentication
 */
export declare function handleBraintree3DS(nonce: string, amount: number, braintreeClient: any, _options?: ThreeDSOptions): Promise<ThreeDSResult>;
/**
 * Handle Authorize.Net Cardinal Commerce 3DS
 * (Authorize.Net uses Cardinal Commerce for 3DS)
 */
export declare function handleAuthorizeNet3DS(transactionId: string, adapter: EnvironmentAdapter, _options?: ThreeDSOptions): Promise<ThreeDSResult>;
/**
 * Check if 3DS is required for the transaction
 */
export declare function is3DSRequired(amount: number, country: string): boolean;
/**
 * Get challenge window size based on device
 */
export declare function getChallengeWindowSize(): '01' | '02' | '03' | '04' | '05';
/**
 * Format 3DS error for display
 */
export declare function format3DSError(result: ThreeDSResult): string;
//# sourceMappingURL=three-d-secure.d.ts.map