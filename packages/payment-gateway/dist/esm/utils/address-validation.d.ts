/**
 * Address Validation Utilities
 * Validates billing addresses for payment processing
 */
export interface BillingAddress {
    firstName: string;
    lastName: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}
export interface AddressValidationResult {
    isValid: boolean;
    errors: string[];
}
/**
 * Validate a billing address
 */
export declare function validateAddress(address: BillingAddress): AddressValidationResult;
/**
 * Validate ZIP/postal code based on country
 */
export declare function validateZipCode(zip: string, country: string): {
    isValid: boolean;
    error?: string;
};
/**
 * Format ZIP code based on country
 */
export declare function formatZipCode(zip: string, country: string): string;
/**
 * Validate state code for US/Canada
 */
export declare function validateStateCode(state: string, country: string): boolean;
/**
 * Get state/province name from code
 */
export declare function getStateName(stateCode: string, country: string): string;
/**
 * Format address for display
 */
export declare function formatAddressForDisplay(address: BillingAddress): string;
//# sourceMappingURL=address-validation.d.ts.map