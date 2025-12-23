/**
 * Input Sanitizer Service
 *
 * Provides input validation and sanitization to prevent:
 * - XSS (Cross-Site Scripting) attacks
 * - SQL/NoSQL injection
 * - Command injection
 * - Invalid data entry
 */
export class InputSanitizerService {
    private static instance: InputSanitizerService;

    static getInstance(): InputSanitizerService {
        if (!InputSanitizerService.instance) {
            InputSanitizerService.instance = new InputSanitizerService();
        }
        return InputSanitizerService.instance;
    }

    /**
     * Sanitize general text input
     * Removes HTML tags and dangerous characters
     */
    sanitizeText(input: string | null | undefined): string {
        if (!input) return '';

        return input
            .toString()
            .trim()
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Remove script-related patterns
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            // Remove null bytes
            .replace(/\0/g, '')
            // Limit length to prevent DoS
            .substring(0, 10000);
    }

    /**
     * Sanitize email input
     * Validates and cleans email addresses
     */
    sanitizeEmail(input: string | null | undefined): string {
        if (!input) return '';

        const cleaned = input
            .toString()
            .trim()
            .toLowerCase()
            // Remove any HTML/script content
            .replace(/<[^>]*>/g, '')
            // Only allow valid email characters
            .replace(/[^a-z0-9._%+\-@]/g, '')
            .substring(0, 254); // Max email length per RFC

        return cleaned;
    }

    /**
     * Validate email format
     */
    isValidEmail(email: string): boolean {
        const emailRegex = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
        return emailRegex.test(email) && email.length <= 254;
    }

    /**
     * Sanitize phone number input
     * Keeps only digits and common phone characters
     */
    sanitizePhoneNumber(input: string | null | undefined): string {
        if (!input) return '';

        return input
            .toString()
            .trim()
            // Only allow digits, +, -, (, ), and spaces
            .replace(/[^0-9+\-() ]/g, '')
            .substring(0, 20);
    }

    /**
     * Validate phone number format
     */
    isValidPhoneNumber(phone: string): boolean {
        // Basic validation: at least 7 digits
        const digitsOnly = phone.replace(/\D/g, '');
        return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    }

    /**
     * Sanitize numeric input
     * Returns only numeric values
     */
    sanitizeNumber(input: string | number | null | undefined): number {
        if (input === null || input === undefined) return 0;

        const num = typeof input === 'number'
            ? input
            : parseFloat(input.toString().replace(/[^0-9.\-]/g, ''));

        return isNaN(num) ? 0 : num;
    }

    /**
     * Sanitize positive integer input (for quantities, etc.)
     */
    sanitizePositiveInteger(input: string | number | null | undefined): number {
        const num = this.sanitizeNumber(input);
        return Math.max(0, Math.floor(num));
    }

    /**
     * Sanitize name input (pharmacy name, medicine name, etc.)
     * Allows letters, numbers, spaces, and common punctuation
     */
    sanitizeName(input: string | null | undefined): string {
        if (!input) return '';

        return input
            .toString()
            .trim()
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Allow letters, numbers, spaces, and common punctuation
            .replace(/[^a-zA-Z0-9\s\-'.,&()]/g, '')
            .substring(0, 200);
    }

    /**
     * Sanitize address input
     * More permissive than name, allows additional characters
     */
    sanitizeAddress(input: string | null | undefined): string {
        if (!input) return '';

        return input
            .toString()
            .trim()
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Allow letters, numbers, spaces, and address-related punctuation
            .replace(/[^a-zA-Z0-9\s\-'.,#/&()]/g, '')
            .substring(0, 500);
    }

    /**
     * Sanitize license number input
     * Allows alphanumeric and hyphens only
     */
    sanitizeLicenseNumber(input: string | null | undefined): string {
        if (!input) return '';

        return input
            .toString()
            .trim()
            .toUpperCase()
            // Only allow alphanumeric and hyphens
            .replace(/[^A-Z0-9\-]/g, '')
            .substring(0, 50);
    }

    /**
     * Sanitize notes/comments input
     * Allows more content but still strips dangerous patterns
     */
    sanitizeNotes(input: string | null | undefined): string {
        if (!input) return '';

        return input
            .toString()
            .trim()
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Remove script patterns
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            // Allow newlines for multiline input
            .substring(0, 2000);
    }

    /**
     * Sanitize search query input
     */
    sanitizeSearchQuery(input: string | null | undefined): string {
        if (!input) return '';

        return input
            .toString()
            .trim()
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Remove special regex characters that could cause issues
            .replace(/[.*+?^${}()|[\]\\]/g, '')
            .substring(0, 100);
    }

    /**
     * Sanitize Firebase document ID
     * Must not contain: / . # $ [ ]
     */
    sanitizeDocumentId(input: string | null | undefined): string {
        if (!input) return '';

        return input
            .toString()
            .trim()
            // Remove Firebase-prohibited characters
            .replace(/[\/\.#$\[\]]/g, '')
            .substring(0, 100);
    }

    /**
     * Escape string for use in Firestore queries
     * Prevents NoSQL injection
     */
    escapeFirestoreValue(input: string): string {
        if (!input) return '';

        // Firestore doesn't have traditional injection issues,
        // but we still sanitize to prevent unexpected behavior
        return this.sanitizeText(input);
    }

    /**
     * Validate and sanitize registration data
     */
    sanitizeRegistrationData(data: any): any {
        return {
            email: this.sanitizeEmail(data.email),
            password: data.password, // Don't sanitize password, just validate length
            phoneNumber: this.sanitizePhoneNumber(data.phoneNumber),
            role: this.sanitizeText(data.role),
            pharmacyName: this.sanitizeName(data.pharmacyName),
            name: this.sanitizeName(data.name),
            licenseNumber: this.sanitizeLicenseNumber(data.licenseNumber || data.license),
            address: this.sanitizeAddress(data.address),
            vehicleType: this.sanitizeText(data.vehicleType)
        };
    }

    /**
     * Validate and sanitize medicine data
     */
    sanitizeMedicineData(data: any): any {
        return {
            name: this.sanitizeName(data.name),
            quantity: this.sanitizePositiveInteger(data.quantity),
            exchangeQuantity: this.sanitizePositiveInteger(data.exchangeQuantity),
            expiryDate: data.expiryDate, // Date validation handled separately
            notes: this.sanitizeNotes(data.notes)
        };
    }

    /**
     * Validate and sanitize exchange data
     */
    sanitizeExchangeData(data: any): any {
        return {
            quantity: this.sanitizePositiveInteger(data.quantity),
            notes: this.sanitizeNotes(data.notes),
            priority: this.sanitizeText(data.priority)
        };
    }
}
