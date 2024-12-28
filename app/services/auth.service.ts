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

    private constructor() {
        super();
        this.authStorage = AuthStorage.getInstance();
        this.authValidator = AuthValidator.getInstance();
        this.securityService = SecurityService.getInstance();
    }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    async register(userData: any): Promise<boolean> {
        try {
            console.log('Registering user:', userData);

            const users = this.authStorage.loadUsers();
            if (users.some(u => u.email === userData.email)) {
                console.error('Email already registered');
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

            users.push(newUser);
            this.authStorage.saveUsers(users);
            console.log('User registered successfully');
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            return false;
        }
    }

    async login(email: string, password: string): Promise<boolean> {
        try {
            console.log('Attempting login for:', email);

            if (this.authValidator.validateAdminCredentials(email, password)) {
                this.currentUser = {
                    id: 'admin-1',
                    email: email,
                    role: 'admin',
                    name: 'Administrator',
                    phoneNumber: ''
                };
                console.log('Admin login successful');
                return true;
            }

            const users = this.authStorage.loadUsers();
            console.log('Registered users:', users);

            const hashedPassword = this.securityService.hashPassword(password);
            const user = users.find(u => 
                u.email === email && u.password === hashedPassword
            );

            if (user) {
                this.currentUser = user;
                console.log('User login successful:', user);
                return true;
            }

            console.log('Login failed: Invalid credentials');
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
        return this.authStorage.loadUsers();
    }

    clearAllUsers(): void {
        this.authStorage.clearUsers();
    }

    logout(): void {
        this.currentUser = null;
    }
}