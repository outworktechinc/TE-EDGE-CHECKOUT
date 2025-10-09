/**
 * Address Validation Utilities
 * Validates billing addresses for payment processing
 */
/**
 * Validate a billing address
 */
export function validateAddress(address) {
    const errors = [];
    // Validate first name
    if (!address.firstName?.trim()) {
        errors.push('First name is required');
    }
    else if (address.firstName.trim().length < 2) {
        errors.push('First name must be at least 2 characters');
    }
    else if (address.firstName.trim().length > 50) {
        errors.push('First name must be less than 50 characters');
    }
    // Validate last name
    if (!address.lastName?.trim()) {
        errors.push('Last name is required');
    }
    else if (address.lastName.trim().length < 2) {
        errors.push('Last name must be at least 2 characters');
    }
    else if (address.lastName.trim().length > 50) {
        errors.push('Last name must be less than 50 characters');
    }
    // Validate address line 1
    if (!address.address?.trim()) {
        errors.push('Address is required');
    }
    else if (address.address.trim().length < 5) {
        errors.push('Address must be at least 5 characters');
    }
    else if (address.address.trim().length > 100) {
        errors.push('Address must be less than 100 characters');
    }
    // Validate address line 2 (optional)
    if (address.address2 && address.address2.trim().length > 100) {
        errors.push('Address line 2 must be less than 100 characters');
    }
    // Validate city
    if (!address.city?.trim()) {
        errors.push('City is required');
    }
    else if (address.city.trim().length < 2) {
        errors.push('City must be at least 2 characters');
    }
    else if (address.city.trim().length > 50) {
        errors.push('City must be less than 50 characters');
    }
    // Validate state
    if (!address.state?.trim()) {
        errors.push('State is required');
    }
    else if (address.country === 'US' || address.country === 'CA') {
        // US and Canada require 2-letter state codes
        if (address.state.trim().length !== 2) {
            errors.push('State must be a 2-letter code (e.g., CA, NY, TX)');
        }
        else if (!/^[A-Z]{2}$/i.test(address.state.trim())) {
            errors.push('State must contain only letters');
        }
    }
    // Validate ZIP/postal code
    if (!address.zip?.trim()) {
        errors.push('ZIP/Postal code is required');
    }
    else {
        const zipValidation = validateZipCode(address.zip, address.country);
        if (!zipValidation.isValid) {
            errors.push(zipValidation.error || 'Invalid ZIP/Postal code');
        }
    }
    // Validate country
    if (!address.country?.trim()) {
        errors.push('Country is required');
    }
    else if (address.country.trim().length !== 2) {
        errors.push('Country must be a 2-letter ISO code (e.g., US, CA, GB)');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Validate ZIP/postal code based on country
 */
export function validateZipCode(zip, country) {
    const cleaned = zip.trim();
    switch (country.toUpperCase()) {
        case 'US':
            // US ZIP: 12345 or 12345-6789
            if (!/^\d{5}(-\d{4})?$/.test(cleaned)) {
                return { isValid: false, error: 'US ZIP code must be in format 12345 or 12345-6789' };
            }
            return { isValid: true };
        case 'CA':
            // Canada postal code: A1A 1A1 or A1A1A1
            if (!/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(cleaned)) {
                return { isValid: false, error: 'Canadian postal code must be in format A1A 1A1' };
            }
            return { isValid: true };
        case 'GB':
            // UK postcode: various formats
            if (!/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(cleaned)) {
                return { isValid: false, error: 'Invalid UK postcode format' };
            }
            return { isValid: true };
        default:
            // Basic validation for other countries (3-10 alphanumeric characters)
            if (cleaned.length < 3 || cleaned.length > 10) {
                return { isValid: false, error: 'Postal code must be between 3 and 10 characters' };
            }
            if (!/^[A-Z0-9\s-]+$/i.test(cleaned)) {
                return { isValid: false, error: 'Postal code contains invalid characters' };
            }
            return { isValid: true };
    }
}
/**
 * Format ZIP code based on country
 */
export function formatZipCode(zip, country) {
    const cleaned = zip.trim().toUpperCase().replace(/\s/g, '');
    switch (country.toUpperCase()) {
        case 'US':
            // Format as 12345 or 12345-6789
            if (cleaned.length === 9 && !cleaned.includes('-')) {
                return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
            }
            return cleaned;
        case 'CA':
            // Format as A1A 1A1
            if (cleaned.length === 6) {
                return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
            }
            return cleaned;
        default:
            return cleaned;
    }
}
/**
 * Validate state code for US/Canada
 */
export function validateStateCode(state, country) {
    const stateUpper = state.toUpperCase();
    if (country === 'US') {
        const validUSStates = [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
            'DC' // District of Columbia
        ];
        return validUSStates.includes(stateUpper);
    }
    if (country === 'CA') {
        const validCAProvinces = [
            'AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE',
            'QC', 'SK', 'YT'
        ];
        return validCAProvinces.includes(stateUpper);
    }
    return true; // Accept any for other countries
}
/**
 * Get state/province name from code
 */
export function getStateName(stateCode, country) {
    const stateUpper = stateCode.toUpperCase();
    if (country === 'US') {
        const usStates = {
            'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
            'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
            'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
            'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
            'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
            'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
            'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
            'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
            'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
            'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
            'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
            'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
            'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
        };
        return usStates[stateUpper] || stateCode;
    }
    if (country === 'CA') {
        const caProvinces = {
            'AB': 'Alberta', 'BC': 'British Columbia', 'MB': 'Manitoba',
            'NB': 'New Brunswick', 'NL': 'Newfoundland and Labrador', 'NT': 'Northwest Territories',
            'NS': 'Nova Scotia', 'NU': 'Nunavut', 'ON': 'Ontario',
            'PE': 'Prince Edward Island', 'QC': 'Quebec', 'SK': 'Saskatchewan',
            'YT': 'Yukon'
        };
        return caProvinces[stateUpper] || stateCode;
    }
    return stateCode;
}
/**
 * Format address for display
 */
export function formatAddressForDisplay(address) {
    const parts = [
        address.address,
        address.address2,
        `${address.city}, ${address.state} ${address.zip}`,
        address.country
    ].filter(Boolean);
    return parts.join('\n');
}
