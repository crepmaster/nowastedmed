import { Observable } from '@nativescript/core';
import { User, UserRole } from '../auth/types/auth.types';
import { AuthStorage } from '../auth/storage/auth.storage';
import { AuthValidator } from '../auth/validation/auth.validator';
import { SecurityService } from './security.service';

export class AuthService extends Observable {
    private static instance: AuthService;
    private currentUser: User | null = null;
    private authStorage: AuthStorage;
    private authValidator: AuthValidator;
    private securityService: SecurityService;
    private registeredUsers: User[] = [];

    private constructor() {
        super();
        this.authStorage = AuthStorage.getInstance();
        this.authValidator = AuthValidator.getInstance();
        this.securityService = SecurityService.getInstance();
        this.loadUsers();
    }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    private loadUsers(): void {
        this.registeredUsers = this.authStorage.loadUsers();
    }

    async register(userData: any): Promise<boolean> {
        try {
            if (!this.authValidator.validateRegistrationData(userData)) {
                return false;
            }

            if (this.registeredUsers.some(u => u.email === userData.email)) {
                return false;
            }

            const newUser: User = {
                id: `user-${Date.now()}`,
                email: userData.email,
                role: userData.role as UserRole,
                name: userData.pharmacyName || userData.name,
                phoneNumber: userData.phoneNumber,
                password: this.securityService.hashPassword(userData.password)
            };

            this.registeredUsers.push(newUser);
            this.authStorage.saveUsers(this.registeredUsers);
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            return false;
        }
    }

    async login(email: string, password: string): Promise<boolean> {
        try {
            if (this.authValidator.validateAdminCredentials(email, password)) {
                this.currentUser = {
                    id: 'admin-1',
                    email: email,
                    role: 'admin',
                    name: 'Administrator',
                    phoneNumber: ''
                };
                return true;
            }

            this.loadUsers();
            const hashedPassword = this.securityService.hashPassword(password);
            const user = this.registeredUsers.find(u => 
                u.email === email && u.password === hashedPassword
            );

            if (user) {
                this.currentUser = user;
                return true;
            }

            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    getRegisteredUsers(): User[] {
        return this.registeredUsers;
    }

    clearAllUsers(): void {
        this.registeredUsers = [];
        this.authStorage.clearUsers();
    }

    logout(): void {
        this.currentUser = null;
    }

    isLoggedIn(): boolean {
        return this.currentUser !== null;
    }
}