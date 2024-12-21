import { SecurityService } from '../../services/security.service';
import { User } from '../types/auth.types';

export class AuthValidator {
    private static instance: AuthValidator;
    private securityService: SecurityService;
    
    private readonly ADMIN_EMAIL = 'ebongueandre@promoshake.net';
    private readonly ADMIN_PASSWORD = '184vi@Tespi!';

    private constructor() {
        this.securityService = SecurityService.getInstance();
    }

    static getInstance(): AuthValidator {
        if (!AuthValidator.instance) {
            AuthValidator.instance = new AuthValidator();
        }
        return AuthValidator.instance;
    }

    validateAdminCredentials(email: string, password: string): boolean {
        return email === this.ADMIN_EMAIL && password === this.ADMIN_PASSWORD;
    }

    validateUserCredentials(user: User, email: string, password: string): boolean {
        console.log('Validating credentials for:', email);
        console.log('User data:', user);
        return user.email === email && user.password === password;
    }

    validateRegistrationData(data: any): boolean {
        return !!(data.email && data.password && data.role);
    }
}