import { SecurityService } from '../../services/security.service';
import { User } from '../types/auth.types';

/**
 * AuthValidator - Handles validation of user credentials and registration data
 *
 * SECURITY NOTE: This validator does NOT store credentials.
 * Admin authentication should be handled through Firebase Auth with proper
 * role-based access control (RBAC) via Firestore security rules.
 */
export class AuthValidator {
    private static instance: AuthValidator;
    private securityService: SecurityService;

    private constructor() {
        this.securityService = SecurityService.getInstance();
    }

    static getInstance(): AuthValidator {
        if (!AuthValidator.instance) {
            AuthValidator.instance = new AuthValidator();
        }
        return AuthValidator.instance;
    }

    /**
     * Validate user credentials format (not authentication)
     * Actual authentication is handled by Firebase Auth
     */
    validateCredentialsFormat(email: string, password: string): { valid: boolean; error?: string } {
        if (!email || !email.includes('@')) {
            return { valid: false, error: 'Invalid email format' };
        }
        if (!password || password.length < 6) {
            return { valid: false, error: 'Password must be at least 6 characters' };
        }
        return { valid: true };
    }

    /**
     * Validate user object has required fields
     * Does NOT log sensitive data
     */
    validateUserCredentials(user: User, email: string, _password: string): boolean {
        // Only validate that user exists and email matches
        // Password verification should be done by Firebase Auth
        return user !== null && user.email === email;
    }

    /**
     * Validate registration data has all required fields
     */
    validateRegistrationData(data: any): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.email || !data.email.includes('@')) {
            errors.push('Valid email is required');
        }
        if (!data.password || data.password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
        if (!data.role || !['pharmacist', 'courier', 'admin'].includes(data.role)) {
            errors.push('Valid role is required (pharmacist, courier, or admin)');
        }

        return { valid: errors.length === 0, errors };
    }
}