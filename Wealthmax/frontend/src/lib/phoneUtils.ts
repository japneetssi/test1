/**
 * Phone number utilities for E.164 format validation and conversion
 * E.164 format: +[country code][subscriber number] (max 15 digits including +)
 */

export interface PhoneValidationResult {
    isValid: boolean;
    formatted: string;
    error?: string;
}

const COUNTRY_CODES: Record<string, string> = {
    'IN': '+91',
    'US': '+1',
    'UK': '+44',
    'CA': '+1',
    'AU': '+61',
    'DE': '+49',
    'FR': '+33',
    'JP': '+81',
    'CN': '+86',
};

/**
 * Validate and format phone number to E.164
 */
export function validateAndFormatPhone(
    input: string, 
    defaultCountry: keyof typeof COUNTRY_CODES = 'IN'
): PhoneValidationResult {
    // Remove all non-digit characters except leading +
    let cleaned = input.replace(/[^\d+]/g, '');
    
    // If empty, return invalid
    if (!cleaned) {
        return { isValid: false, formatted: '', error: 'Phone number required' };
    }
    
    // If starts with +, validate E.164
    if (cleaned.startsWith('+')) {
        const digits = cleaned.substring(1);
        if (digits.length < 7 || digits.length > 14) {
            return { isValid: false, formatted: cleaned, error: 'Invalid phone number length' };
        }
        if (!/^\d+$/.test(digits)) {
            return { isValid: false, formatted: cleaned, error: 'Invalid format' };
        }
        return { isValid: true, formatted: cleaned };
    }
    
    // If no +, prepend country code
    const countryCode = COUNTRY_CODES[defaultCountry];
    const withCountry = `${countryCode}${cleaned}`;
    
    // Validate total length (E.164 max 15 including +)
    if (withCountry.length > 15) {
        return { isValid: false, formatted: withCountry, error: 'Phone number too long' };
    }
    
    return { isValid: true, formatted: withCountry };
}

/**
 * Get country code from E.164 number
 */
export function getCountryFromE164(phoneNumber: string): string {
    if (!phoneNumber?.startsWith('+')) return '';
    return phoneNumber.substring(0, phoneNumber.length > 12 ? 4 : 3);
}

/**
 * Format phone for display (remove country code for local format)
 */
export function formatPhoneForDisplay(phoneNumber: string, countryCode: string = '+91'): string {
    if (!phoneNumber) return '';
    if (phoneNumber.startsWith('+')) {
        // Remove country code for display
        const digits = phoneNumber.substring(1);
        if (countryCode === '+91' && digits.length === 10) {
            return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
        }
        return phoneNumber;
    }
    return phoneNumber;
}

/**
 * Parse display format back to E.164
 */
export function parsePhoneInput(input: string): string {
    // Handle " +91 12345 67890" format
    const cleaned = input.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('+')) {
        return cleaned;
    }
    // Assume Indian number without code
    return `+91${cleaned}`;
}