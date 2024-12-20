export class ValidationUtil {
    private static instance: ValidationUtil;

    private constructor() {}

    static getInstance(): ValidationUtil {
        if (!ValidationUtil.instance) {
            ValidationUtil.instance = new ValidationUtil();
        }
        return ValidationUtil.instance;
    }

    isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPassword(password: string): boolean {
        return password.length >= 8;
    }

    isValidPhoneNumber(phone: string): boolean {
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        return phoneRegex.test(phone);
    }
}