import { Observable } from '@nativescript/core';
import { Pharmacist, User } from '../models/user.model';
import { SecurityService } from './security.service';

export class AuthService extends Observable {
    private static instance: AuthService;
    private currentUser: User | null = null;
    private securityService: SecurityService;

    private readonly ADMIN_EMAIL = 'ebongueandre@promoshake.net';
    private readonly ADMIN_PASSWORD = '184vi@Tespi!';

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    constructor() {
        super();
        this.securityService = SecurityService.getInstance();
    }

    async register(registrationData: any): Promise<boolean> {
        try {
            // TODO: Implement actual API registration
            console.log('Registration data:', registrationData);
            
            // Simulate successful registration
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            return false;
        }
    }

    async login(email: string, password: string): Promise<boolean> {
        try {
            // Admin login check
            if (email === this.ADMIN_EMAIL && password === this.ADMIN_PASSWORD) {
                this.currentUser = {
                    id: 'admin-1',
                    email: email,
                    role: 'admin',
                    name: 'Administrator',
                    phoneNumber: ''
                };
                return true;
            }

            // TODO: Implement actual API authentication for other users
            if (email && password) {
                this.currentUser = {
                    id: 'pharm-1',
                    email: email,
                    role: 'pharmacist',
                    name: 'Test Pharmacy',
                    phoneNumber: '+1234567890'
                };
                return true;
            }

            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    isLoggedIn(): boolean {
        return this.currentUser !== null;
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    logout(): void {
        this.currentUser = null;
    }
}